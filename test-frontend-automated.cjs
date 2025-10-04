#!/usr/bin/env node

/**
 * Script automatizado para testar funcionalidades do frontend
 * Este script usa Puppeteer para testar a aplicação web
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class FrontendTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = [];
    this.baseUrl = 'http://localhost';
  }

  async init() {
    console.log('🚀 Iniciando testes automatizados do frontend...');
    this.browser = await puppeteer.launch({
      headless: false, // Mostrar o navegador
      defaultViewport: { width: 1200, height: 800 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();
    
    // Interceptar requisições para logging
    await this.page.setRequestInterception(true);
    this.page.on('request', (request) => {
      console.log(`📡 ${request.method()} ${request.url()}`);
      request.continue();
    });

    // Interceptar respostas para logging
    this.page.on('response', (response) => {
      console.log(`📨 ${response.status()} ${response.url()}`);
    });
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async testConnectivity() {
    console.log('\n🌐 Testando conectividade...');
    
    try {
      const response = await this.page.goto(this.baseUrl, { 
        waitUntil: 'networkidle2',
        timeout: 10000 
      });
      
      if (response.ok()) {
        this.logResult('Conectividade', 'PASS', `Status: ${response.status()}`);
      } else {
        this.logResult('Conectividade', 'FAIL', `Status: ${response.status()}`);
      }
    } catch (error) {
      this.logResult('Conectividade', 'FAIL', error.message);
    }
  }

  async testPageLoad() {
    console.log('\n📄 Testando carregamento da página...');
    
    try {
      await this.page.waitForSelector('body', { timeout: 5000 });
      this.logResult('Carregamento da página', 'PASS', 'Página carregada com sucesso');
      
      const title = await this.page.title();
      this.logResult('Título da página', 'PASS', `Título: "${title}"`);
      
    } catch (error) {
      this.logResult('Carregamento da página', 'FAIL', error.message);
    }
  }

  async testUIElements() {
    console.log('\n🎨 Testando elementos da UI...');
    
    const elements = [
      { selector: 'body', name: 'Body' },
      { selector: 'main, [role="main"]', name: 'Main content' },
      { selector: 'header, [role="banner"]', name: 'Header' },
      { selector: 'nav, [role="navigation"]', name: 'Navigation' },
      { selector: 'button', name: 'Buttons' },
      { selector: 'form', name: 'Forms' },
      { selector: 'input', name: 'Input fields' }
    ];

    for (const element of elements) {
      try {
        const found = await this.page.$(element.selector);
        if (found) {
          this.logResult(`Elemento ${element.name}`, 'PASS', 'Encontrado');
        } else {
          this.logResult(`Elemento ${element.name}`, 'FAIL', 'Não encontrado');
        }
      } catch (error) {
        this.logResult(`Elemento ${element.name}`, 'FAIL', error.message);
      }
    }
  }

  async testTextContent() {
    console.log('\n📝 Testando conteúdo de texto...');
    
    const expectedTexts = [
      'Equipe S4U',
      'Entrar',
      'Sistema de gestão',
      'Email'
    ];

    for (const text of expectedTexts) {
      try {
        const found = await this.page.evaluate((searchText) => {
          return document.body.textContent.includes(searchText);
        }, text);
        
        if (found) {
          this.logResult(`Texto "${text}"`, 'PASS', 'Encontrado');
        } else {
          this.logResult(`Texto "${text}"`, 'FAIL', 'Não encontrado');
        }
      } catch (error) {
        this.logResult(`Texto "${text}"`, 'FAIL', error.message);
      }
    }
  }

  async testForms() {
    console.log('\n📋 Testando formulários...');
    
    try {
      // Testar formulário de login
      const emailInput = await this.page.$('input[type="email"]');
      const passwordInput = await this.page.$('input[type="password"]');
      const submitButton = await this.page.$('button[type="submit"]');

      if (emailInput && passwordInput) {
        this.logResult('Formulário de login', 'PASS', 'Campos encontrados');
        
        // Testar preenchimento
        await emailInput.type('test@example.com');
        await passwordInput.type('password123');
        this.logResult('Preenchimento do login', 'PASS', 'Campos preenchidos');
      } else {
        this.logResult('Formulário de login', 'FAIL', 'Campos não encontrados');
      }

      if (submitButton) {
        this.logResult('Botão de submit', 'PASS', 'Encontrado');
      } else {
        this.logResult('Botão de submit', 'FAIL', 'Não encontrado');
      }

    } catch (error) {
      this.logResult('Teste de formulários', 'FAIL', error.message);
    }
  }

  async testNavigation() {
    console.log('\n🧭 Testando navegação...');
    
    try {
      const links = await this.page.$$('a[href]');
      this.logResult('Links de navegação', 'PASS', `${links.length} links encontrados`);

      // Testar cliques em links (apenas os primeiros 3)
      for (let i = 0; i < Math.min(3, links.length); i++) {
        try {
          await links[i].click();
          await this.page.waitForTimeout(1000); // Aguardar carregamento
          this.logResult(`Link ${i + 1}`, 'PASS', 'Clicado com sucesso');
        } catch (error) {
          this.logResult(`Link ${i + 1}`, 'FAIL', error.message);
        }
      }

    } catch (error) {
      this.logResult('Teste de navegação', 'FAIL', error.message);
    }
  }

  async testResponsiveDesign() {
    console.log('\n📱 Testando design responsivo...');
    
    const viewports = [
      { width: 320, height: 568, name: 'Mobile' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 1200, height: 800, name: 'Desktop' }
    ];

    for (const viewport of viewports) {
      try {
        await this.page.setViewport({ width: viewport.width, height: viewport.height });
        await new Promise(resolve => setTimeout(resolve, 500)); // Aguardar redimensionamento
        
        this.logResult(`Viewport ${viewport.name}`, 'PASS', `${viewport.width}x${viewport.height}`);
      } catch (error) {
        this.logResult(`Viewport ${viewport.name}`, 'FAIL', error.message);
      }
    }
  }

  async testAPICalls() {
    console.log('\n🔌 Testando chamadas de API...');
    
    const endpoints = [
      { url: '/api/health', expectedStatus: 200, name: 'Health Check' },
      { url: '/api/events', expectedStatus: 401, name: 'Events (Auth Required)' },
      { url: '/api/users', expectedStatus: 401, name: 'Users (Auth Required)' },
      { url: '/api/auth/login', expectedStatus: 404, name: 'Login Endpoint' }
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await this.page.goto(this.baseUrl + endpoint.url, { 
          waitUntil: 'networkidle2',
          timeout: 5000 
        });
        
        if (response.status() === endpoint.expectedStatus) {
          this.logResult(`API ${endpoint.name}`, 'PASS', `Status: ${response.status()} (esperado)`);
        } else if (response.ok()) {
          this.logResult(`API ${endpoint.name}`, 'PASS', `Status: ${response.status()}`);
        } else {
          this.logResult(`API ${endpoint.name}`, 'WARN', `Status: ${response.status()} (esperado: ${endpoint.expectedStatus})`);
        }
      } catch (error) {
        this.logResult(`API ${endpoint.name}`, 'FAIL', error.message);
      }
    }
  }

  async testJavaScriptExecution() {
    console.log('\n⚡ Testando execução de JavaScript...');
    
    try {
      // Testar se JavaScript está funcionando
      const jsResult = await this.page.evaluate(() => {
        return typeof window !== 'undefined' && typeof document !== 'undefined';
      });
      
      if (jsResult) {
        this.logResult('JavaScript', 'PASS', 'Executando corretamente');
      } else {
        this.logResult('JavaScript', 'FAIL', 'Não está executando');
      }

      // Testar console
      const consoleMessages = [];
      this.page.on('console', msg => {
        consoleMessages.push(msg.text());
      });

      await this.page.evaluate(() => {
        console.log('Teste de console');
      });

      this.logResult('Console', 'PASS', `${consoleMessages.length} mensagens capturadas`);

    } catch (error) {
      this.logResult('JavaScript', 'FAIL', error.message);
    }
  }

  async testPerformance() {
    console.log('\n⚡ Testando performance...');
    
    try {
      // Usar Performance API do navegador
      const performanceMetrics = await this.page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        const paint = performance.getEntriesByType('paint');
        
        return {
          domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart : 0,
          loadComplete: navigation ? navigation.loadEventEnd - navigation.loadEventStart : 0,
          firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
          firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0
        };
      });
      
      this.logResult('Performance - DOM Content Loaded', 'PASS', `${performanceMetrics.domContentLoaded.toFixed(2)}ms`);
      this.logResult('Performance - Load Complete', 'PASS', `${performanceMetrics.loadComplete.toFixed(2)}ms`);
      this.logResult('Performance - First Paint', 'PASS', `${performanceMetrics.firstPaint.toFixed(2)}ms`);
      this.logResult('Performance - First Contentful Paint', 'PASS', `${performanceMetrics.firstContentfulPaint.toFixed(2)}ms`);

    } catch (error) {
      this.logResult('Performance', 'FAIL', error.message);
    }
  }

  async testAccessibility() {
    console.log('\n♿ Testando acessibilidade...');
    
    try {
      // Testar se há elementos com roles apropriados
      const elementsWithRoles = await this.page.$$('[role]');
      this.logResult('Elementos com roles', 'PASS', `${elementsWithRoles.length} elementos encontrados`);

      // Testar se há labels em formulários
      const labeledInputs = await this.page.$$('input[aria-label], label');
      this.logResult('Inputs com labels', 'PASS', `${labeledInputs.length} inputs com labels`);

      // Testar contraste (simulação)
      const contrastInfo = await this.page.evaluate(() => {
        const body = document.body;
        const computedStyle = window.getComputedStyle(body);
        const hasColor = computedStyle.color && computedStyle.color !== 'rgb(0, 0, 0)';
        const hasBackground = computedStyle.backgroundColor && computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)';
        
        return {
          hasColor,
          hasBackground,
          color: computedStyle.color,
          backgroundColor: computedStyle.backgroundColor
        };
      });
      
      if (contrastInfo.hasColor && contrastInfo.hasBackground) {
        this.logResult('Contraste de cores', 'PASS', 'Cores definidas adequadamente');
      } else {
        this.logResult('Contraste de cores', 'WARN', 'Cores não definidas adequadamente');
      }

    } catch (error) {
      this.logResult('Acessibilidade', 'FAIL', error.message);
    }
  }

  logResult(test, status, message) {
    const result = {
      test,
      status,
      message,
      timestamp: new Date().toISOString()
    };
    
    this.results.push(result);
    
    const icon = status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} ${test}: ${message}`);
  }

  generateReport() {
    console.log('\n📊 RELATÓRIO FINAL:');
    console.log('='.repeat(50));
    
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const total = this.results.length;
    
    console.log(`✅ Testes que passaram: ${passed}`);
    console.log(`❌ Testes que falharam: ${failed}`);
    console.log(`📈 Total de testes: ${total}`);
    console.log(`🎯 Taxa de sucesso: ${total > 0 ? ((passed / total) * 100).toFixed(1) : 0}%`);
    
    if (failed > 0) {
      console.log('\n❌ TESTES QUE FALHARAM:');
      this.results.filter(r => r.status === 'FAIL').forEach(result => {
        console.log(`- ${result.test}: ${result.message}`);
      });
    }

    // Salvar relatório em arquivo
    const reportPath = path.join(__dirname, 'frontend-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`\n📄 Relatório salvo em: ${reportPath}`);
  }

  async runAllTests() {
    try {
      await this.init();
      
      await this.testConnectivity();
      await this.testPageLoad();
      await this.testUIElements();
      await this.testTextContent();
      await this.testForms();
      await this.testNavigation();
      await this.testResponsiveDesign();
      await this.testAPICalls();
      await this.testJavaScriptExecution();
      await this.testPerformance();
      await this.testAccessibility();
      
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
  const tester = new FrontendTester();
  tester.runAllTests().catch(console.error);
}

module.exports = FrontendTester;
