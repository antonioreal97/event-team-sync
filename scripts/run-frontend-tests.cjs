#!/usr/bin/env node

/**
 * Script para executar testes do frontend usando Chrome DevTools
 * Este script abre o navegador e executa os testes automaticamente
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class FrontendTestRunner {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = [];
  }

  async init() {
    console.log('🚀 Iniciando testes do frontend com Chrome DevTools...');
    
    this.browser = await puppeteer.launch({
      headless: false, // Mostrar o navegador
      defaultViewport: { width: 1200, height: 800 },
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });
    
    this.page = await this.browser.newPage();
    
    // Configurar interceptação de requisições
    await this.page.setRequestInterception(true);
    this.page.on('request', (request) => {
      console.log(`📡 ${request.method()} ${request.url()}`);
      request.continue();
    });

    this.page.on('response', (response) => {
      console.log(`📨 ${response.status()} ${response.url()}`);
    });

    // Configurar console para capturar logs
    this.page.on('console', (msg) => {
      console.log(`🖥️ ${msg.type().toUpperCase()}: ${msg.text()}`);
    });
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async loadApplication() {
    console.log('\n🌐 Carregando aplicação...');
    
    try {
      await this.page.goto('http://localhost', { 
        waitUntil: 'networkidle2',
        timeout: 10000 
      });
      
      console.log('✅ Aplicação carregada com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao carregar aplicação:', error.message);
      return false;
    }
  }

  async injectTestScript() {
    console.log('\n💉 Injetando script de testes...');
    
    try {
      // Ler o arquivo de testes
      const testScriptPath = path.join(__dirname, 'src/test/chrome-devtools-tests.js');
      const testScript = fs.readFileSync(testScriptPath, 'utf8');
      
      // Injetar o script na página
      await this.page.evaluate(testScript);
      
      console.log('✅ Script de testes injetado com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao injetar script:', error.message);
      return false;
    }
  }

  async executeTests() {
    console.log('\n🧪 Executando testes...');
    
    try {
      // Executar os testes
      const results = await this.page.evaluate(async () => {
        if (window.tester) {
          await window.tester.runAllTests();
          return window.tester.results;
        }
        return [];
      });
      
      this.results = results;
      console.log('✅ Testes executados com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao executar testes:', error.message);
      return false;
    }
  }

  async testSpecificFeatures() {
    console.log('\n🎯 Testando funcionalidades específicas...');
    
    try {
      // Testar elementos da página
      const elements = await this.page.evaluate(() => {
        return {
          title: document.title,
          bodyText: document.body.textContent.substring(0, 200),
          hasForms: document.querySelectorAll('form').length,
          hasInputs: document.querySelectorAll('input').length,
          hasButtons: document.querySelectorAll('button').length,
          hasLinks: document.querySelectorAll('a').length
        };
      });
      
      console.log('📄 Informações da página:');
      console.log(`   Título: ${elements.title}`);
      console.log(`   Texto: ${elements.bodyText}...`);
      console.log(`   Formulários: ${elements.hasForms}`);
      console.log(`   Inputs: ${elements.hasInputs}`);
      console.log(`   Botões: ${elements.hasButtons}`);
      console.log(`   Links: ${elements.hasLinks}`);
      
      // Testar interações
      await this.testInteractions();
      
      return true;
    } catch (error) {
      console.error('❌ Erro ao testar funcionalidades:', error.message);
      return false;
    }
  }

  async testInteractions() {
    console.log('\n🖱️ Testando interações...');
    
    try {
      // Testar cliques em botões
      const buttons = await this.page.$$('button');
      console.log(`   Encontrados ${buttons.length} botões`);
      
      for (let i = 0; i < Math.min(3, buttons.length); i++) {
        try {
          await buttons[i].click();
          console.log(`   ✅ Botão ${i + 1} clicado`);
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.log(`   ❌ Erro ao clicar no botão ${i + 1}: ${error.message}`);
        }
      }
      
      // Testar preenchimento de formulários
      const inputs = await this.page.$$('input[type="text"], input[type="email"], input[type="password"]');
      console.log(`   Encontrados ${inputs.length} inputs`);
      
      for (let i = 0; i < Math.min(3, inputs.length); i++) {
        try {
          await inputs[i].type('teste');
          console.log(`   ✅ Input ${i + 1} preenchido`);
        } catch (error) {
          console.log(`   ❌ Erro ao preencher input ${i + 1}: ${error.message}`);
        }
      }
      
    } catch (error) {
      console.error('❌ Erro ao testar interações:', error.message);
    }
  }

  async testPerformance() {
    console.log('\n⚡ Testando performance...');
    
    try {
      const metrics = await this.page.metrics();
      console.log('📊 Métricas de performance:');
      console.log(`   First Contentful Paint: ${metrics.FirstContentfulPaint}ms`);
      console.log(`   Largest Contentful Paint: ${metrics.LargestContentfulPaint}ms`);
      console.log(`   First Input Delay: ${metrics.FirstInputDelay}ms`);
      console.log(`   Cumulative Layout Shift: ${metrics.CumulativeLayoutShift}`);
      
      // Testar memória
      const memoryInfo = await this.page.evaluate(() => {
        if (performance.memory) {
          return {
            used: Math.round(performance.memory.usedJSHeapSize / 1048576),
            total: Math.round(performance.memory.totalJSHeapSize / 1048576),
            limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576)
          };
        }
        return null;
      });
      
      if (memoryInfo) {
        console.log('🧠 Informações de memória:');
        console.log(`   Usada: ${memoryInfo.used}MB`);
        console.log(`   Total: ${memoryInfo.total}MB`);
        console.log(`   Limite: ${memoryInfo.limit}MB`);
      }
      
    } catch (error) {
      console.error('❌ Erro ao testar performance:', error.message);
    }
  }

  async testNetwork() {
    console.log('\n🌐 Testando rede...');
    
    try {
      const resources = await this.page.evaluate(() => {
        const entries = performance.getEntriesByType('resource');
        return {
          total: entries.length,
          totalSize: entries.reduce((sum, entry) => sum + (entry.transferSize || 0), 0),
          totalTime: entries.reduce((sum, entry) => sum + entry.duration, 0),
          slowResources: entries.filter(entry => entry.duration > 1000).length
        };
      });
      
      console.log('📡 Estatísticas de rede:');
      console.log(`   Total de recursos: ${resources.total}`);
      console.log(`   Tamanho total: ${(resources.totalSize / 1024).toFixed(2)}KB`);
      console.log(`   Tempo total: ${resources.totalTime.toFixed(2)}ms`);
      console.log(`   Recursos lentos (>1s): ${resources.slowResources}`);
      
    } catch (error) {
      console.error('❌ Erro ao testar rede:', error.message);
    }
  }

  generateReport() {
    console.log('\n📊 RELATÓRIO FINAL:');
    console.log('='.repeat(50));
    
    if (this.results.length > 0) {
      const passed = this.results.filter(r => r.status === 'PASS').length;
      const failed = this.results.filter(r => r.status === 'FAIL').length;
      const warnings = this.results.filter(r => r.status === 'WARN').length;
      const total = this.results.length;
      
      console.log(`✅ Testes que passaram: ${passed}`);
      console.log(`❌ Testes que falharam: ${failed}`);
      console.log(`⚠️ Avisos: ${warnings}`);
      console.log(`📈 Total de testes: ${total}`);
      console.log(`🎯 Taxa de sucesso: ${total > 0 ? ((passed / total) * 100).toFixed(1) : 0}%`);
      
      if (failed > 0) {
        console.log('\n❌ TESTES QUE FALHARAM:');
        this.results.filter(r => r.status === 'FAIL').forEach(result => {
          console.log(`- ${result.test}: ${result.message}`);
        });
      }
    } else {
      console.log('ℹ️ Nenhum resultado de teste disponível');
    }
    
    // Salvar relatório
    const reportPath = path.join(__dirname, 'frontend-chrome-devtools-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      results: this.results
    }, null, 2));
    
    console.log(`\n📄 Relatório salvo em: ${reportPath}`);
  }

  async runAllTests() {
    try {
      await this.init();
      
      const loaded = await this.loadApplication();
      if (!loaded) {
        console.error('❌ Não foi possível carregar a aplicação');
        return;
      }
      
      await this.testSpecificFeatures();
      await this.testPerformance();
      await this.testNetwork();
      
      const injected = await this.injectTestScript();
      if (injected) {
        await this.executeTests();
      }
      
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Erro durante execução dos testes:', error);
    } finally {
      await this.cleanup();
    }
  }
}

// Executar testes se o script for chamado diretamente
if (require.main === module) {
  const runner = new FrontendTestRunner();
  runner.runAllTests().catch(console.error);
}

module.exports = FrontendTestRunner;
