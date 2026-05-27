#!/usr/bin/env node

/**
 * Script principal para executar todos os testes do frontend
 * Combina testes unitários, testes automatizados e testes com Chrome DevTools
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class AllTestsRunner {
  constructor() {
    this.results = {
      unitTests: null,
      automatedTests: null,
      chromeDevToolsTests: null,
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        warnings: 0,
        successRate: 0
      }
    };
  }

  async runUnitTests() {
    console.log('🧪 Executando testes unitários...');
    console.log('='.repeat(50));
    
    try {
      const output = execSync('npm test -- --run --reporter=json', { 
        encoding: 'utf8',
        cwd: process.cwd()
      });
      
      const unitTestResults = JSON.parse(output);
      this.results.unitTests = unitTestResults;
      
      console.log(`✅ Testes unitários executados: ${unitTestResults.numTotalTests} testes`);
      console.log(`   Passou: ${unitTestResults.numPassedTests}`);
      console.log(`   Falhou: ${unitTestResults.numFailedTests}`);
      
      return true;
    } catch (error) {
      console.error('❌ Erro ao executar testes unitários:', error.message);
      return false;
    }
  }

  async runAutomatedTests() {
    console.log('\n🤖 Executando testes automatizados...');
    console.log('='.repeat(50));
    
    try {
      const output = execSync('node test-frontend-automated.cjs', { 
        encoding: 'utf8',
        cwd: process.cwd()
      });
      
      console.log('✅ Testes automatizados executados');
      console.log(output);
      
      // Tentar ler o relatório gerado
      const reportPath = path.join(process.cwd(), 'frontend-test-report.json');
      if (fs.existsSync(reportPath)) {
        const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
        this.results.automatedTests = report;
      }
      
      return true;
    } catch (error) {
      console.error('❌ Erro ao executar testes automatizados:', error.message);
      return false;
    }
  }

  async runChromeDevToolsTests() {
    console.log('\n🔧 Executando testes com Chrome DevTools...');
    console.log('='.repeat(50));
    
    try {
      const output = execSync('node run-frontend-tests.cjs', { 
        encoding: 'utf8',
        cwd: process.cwd()
      });
      
      console.log('✅ Testes com Chrome DevTools executados');
      console.log(output);
      
      // Tentar ler o relatório gerado
      const reportPath = path.join(process.cwd(), 'frontend-chrome-devtools-report.json');
      if (fs.existsSync(reportPath)) {
        const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
        this.results.chromeDevToolsTests = report;
      }
      
      return true;
    } catch (error) {
      console.error('❌ Erro ao executar testes com Chrome DevTools:', error.message);
      return false;
    }
  }

  calculateSummary() {
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    let warnings = 0;

    // Testes unitários
    if (this.results.unitTests) {
      totalTests += this.results.unitTests.numTotalTests || 0;
      passedTests += this.results.unitTests.numPassedTests || 0;
      failedTests += this.results.unitTests.numFailedTests || 0;
    }

    // Testes automatizados
    if (this.results.automatedTests) {
      const automated = this.results.automatedTests;
      totalTests += automated.length || 0;
      passedTests += automated.filter(r => r.status === 'PASS').length || 0;
      failedTests += automated.filter(r => r.status === 'FAIL').length || 0;
    }

    // Testes Chrome DevTools
    if (this.results.chromeDevToolsTests && this.results.chromeDevToolsTests.results) {
      const chrome = this.results.chromeDevToolsTests.results;
      totalTests += chrome.length || 0;
      passedTests += chrome.filter(r => r.status === 'PASS').length || 0;
      failedTests += chrome.filter(r => r.status === 'FAIL').length || 0;
      warnings += chrome.filter(r => r.status === 'WARN').length || 0;
    }

    this.results.summary = {
      totalTests,
      passedTests,
      failedTests,
      warnings,
      successRate: totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0
    };
  }

  generateFinalReport() {
    console.log('\n📊 RELATÓRIO FINAL COMPLETO');
    console.log('='.repeat(60));
    
    const { totalTests, passedTests, failedTests, warnings, successRate } = this.results.summary;
    
    console.log(`🎯 RESUMO GERAL:`);
    console.log(`   Total de testes: ${totalTests}`);
    console.log(`   ✅ Passou: ${passedTests}`);
    console.log(`   ❌ Falhou: ${failedTests}`);
    console.log(`   ⚠️ Avisos: ${warnings}`);
    console.log(`   📈 Taxa de sucesso: ${successRate}%`);
    
    console.log('\n📋 DETALHES POR CATEGORIA:');
    
    // Testes unitários
    if (this.results.unitTests) {
      const unit = this.results.unitTests;
      console.log(`\n🧪 TESTES UNITÁRIOS:`);
      console.log(`   Total: ${unit.numTotalTests || 0}`);
      console.log(`   Passou: ${unit.numPassedTests || 0}`);
      console.log(`   Falhou: ${unit.numFailedTests || 0}`);
      console.log(`   Taxa: ${unit.numTotalTests > 0 ? ((unit.numPassedTests / unit.numTotalTests) * 100).toFixed(1) : 0}%`);
    }
    
    // Testes automatizados
    if (this.results.automatedTests) {
      const automated = this.results.automatedTests;
      const automatedPassed = automated.filter(r => r.status === 'PASS').length;
      const automatedFailed = automated.filter(r => r.status === 'FAIL').length;
      console.log(`\n🤖 TESTES AUTOMATIZADOS:`);
      console.log(`   Total: ${automated.length || 0}`);
      console.log(`   Passou: ${automatedPassed}`);
      console.log(`   Falhou: ${automatedFailed}`);
      console.log(`   Taxa: ${automated.length > 0 ? ((automatedPassed / automated.length) * 100).toFixed(1) : 0}%`);
    }
    
    // Testes Chrome DevTools
    if (this.results.chromeDevToolsTests && this.results.chromeDevToolsTests.results) {
      const chrome = this.results.chromeDevToolsTests.results;
      const chromePassed = chrome.filter(r => r.status === 'PASS').length;
      const chromeFailed = chrome.filter(r => r.status === 'FAIL').length;
      const chromeWarnings = chrome.filter(r => r.status === 'WARN').length;
      console.log(`\n🔧 TESTES CHROME DEVTOOLS:`);
      console.log(`   Total: ${chrome.length || 0}`);
      console.log(`   Passou: ${chromePassed}`);
      console.log(`   Falhou: ${chromeFailed}`);
      console.log(`   Avisos: ${chromeWarnings}`);
      console.log(`   Taxa: ${chrome.length > 0 ? ((chromePassed / chrome.length) * 100).toFixed(1) : 0}%`);
    }
    
    console.log('\n🎯 RECOMENDAÇÕES:');
    
    if (failedTests > 0) {
      console.log(`   ❌ Corrigir ${failedTests} testes que falharam`);
    }
    
    if (warnings > 0) {
      console.log(`   ⚠️ Revisar ${warnings} avisos`);
    }
    
    if (parseFloat(successRate) < 80) {
      console.log(`   🔧 Melhorar cobertura de testes (atual: ${successRate}%)`);
    } else if (parseFloat(successRate) >= 90) {
      console.log(`   🎉 Excelente cobertura de testes (${successRate}%)`);
    } else {
      console.log(`   ✅ Boa cobertura de testes (${successRate}%)`);
    }
    
    // Salvar relatório final
    const finalReport = {
      timestamp: new Date().toISOString(),
      summary: this.results.summary,
      details: {
        unitTests: this.results.unitTests,
        automatedTests: this.results.automatedTests,
        chromeDevToolsTests: this.results.chromeDevToolsTests
      }
    };
    
    const reportPath = path.join(process.cwd(), 'frontend-tests-final-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(finalReport, null, 2));
    
    console.log(`\n📄 Relatório final salvo em: ${reportPath}`);
    
    // Gerar relatório em HTML
    this.generateHTMLReport(finalReport);
  }

  generateHTMLReport(data) {
    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório de Testes - Event Team Sync</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 8px;
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .summary-card {
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            color: white;
        }
        .summary-card.passed { background: #28a745; }
        .summary-card.failed { background: #dc3545; }
        .summary-card.warnings { background: #ffc107; color: #333; }
        .summary-card.total { background: #17a2b8; }
        .category {
            margin: 30px 0;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 8px;
        }
        .category h3 {
            margin-top: 0;
            color: #333;
        }
        .progress-bar {
            width: 100%;
            height: 20px;
            background-color: #e9ecef;
            border-radius: 10px;
            overflow: hidden;
            margin: 10px 0;
        }
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #28a745, #20c997);
            transition: width 0.3s ease;
        }
        .recommendations {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .recommendations h3 {
            color: #495057;
            margin-top: 0;
        }
        .recommendations ul {
            margin: 0;
            padding-left: 20px;
        }
        .timestamp {
            text-align: center;
            color: #6c757d;
            font-size: 0.9em;
            margin-top: 30px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 Relatório de Testes Frontend</h1>
            <h2>Event Team Sync</h2>
            <p>Relatório gerado em: ${new Date(data.timestamp).toLocaleString('pt-BR')}</p>
        </div>
        
        <div class="summary">
            <div class="summary-card total">
                <h3>Total de Testes</h3>
                <h2>${data.summary.totalTests}</h2>
            </div>
            <div class="summary-card passed">
                <h3>Passou</h3>
                <h2>${data.summary.passedTests}</h2>
            </div>
            <div class="summary-card failed">
                <h3>Falhou</h3>
                <h2>${data.summary.failedTests}</h2>
            </div>
            <div class="summary-card warnings">
                <h3>Avisos</h3>
                <h2>${data.summary.warnings}</h2>
            </div>
        </div>
        
        <div class="progress-bar">
            <div class="progress-fill" style="width: ${data.summary.successRate}%"></div>
        </div>
        <p style="text-align: center; font-size: 1.2em; font-weight: bold;">
            Taxa de Sucesso: ${data.summary.successRate}%
        </p>
        
        ${data.details.unitTests ? `
        <div class="category">
            <h3>🧪 Testes Unitários</h3>
            <p><strong>Total:</strong> ${data.details.unitTests.numTotalTests || 0}</p>
            <p><strong>Passou:</strong> ${data.details.unitTests.numPassedTests || 0}</p>
            <p><strong>Falhou:</strong> ${data.details.unitTests.numFailedTests || 0}</p>
            <p><strong>Taxa de sucesso:</strong> ${data.details.unitTests.numTotalTests > 0 ? ((data.details.unitTests.numPassedTests / data.details.unitTests.numTotalTests) * 100).toFixed(1) : 0}%</p>
        </div>
        ` : ''}
        
        ${data.details.automatedTests ? `
        <div class="category">
            <h3>🤖 Testes Automatizados</h3>
            <p><strong>Total:</strong> ${data.details.automatedTests.length || 0}</p>
            <p><strong>Passou:</strong> ${data.details.automatedTests.filter(r => r.status === 'PASS').length}</p>
            <p><strong>Falhou:</strong> ${data.details.automatedTests.filter(r => r.status === 'FAIL').length}</p>
        </div>
        ` : ''}
        
        ${data.details.chromeDevToolsTests && data.details.chromeDevToolsTests.results ? `
        <div class="category">
            <h3>🔧 Testes Chrome DevTools</h3>
            <p><strong>Total:</strong> ${data.details.chromeDevToolsTests.results.length || 0}</p>
            <p><strong>Passou:</strong> ${data.details.chromeDevToolsTests.results.filter(r => r.status === 'PASS').length}</p>
            <p><strong>Falhou:</strong> ${data.details.chromeDevToolsTests.results.filter(r => r.status === 'FAIL').length}</p>
            <p><strong>Avisos:</strong> ${data.details.chromeDevToolsTests.results.filter(r => r.status === 'WARN').length}</p>
        </div>
        ` : ''}
        
        <div class="recommendations">
            <h3>🎯 Recomendações</h3>
            <ul>
                ${data.summary.failedTests > 0 ? `<li>❌ Corrigir ${data.summary.failedTests} testes que falharam</li>` : ''}
                ${data.summary.warnings > 0 ? `<li>⚠️ Revisar ${data.summary.warnings} avisos</li>` : ''}
                ${parseFloat(data.summary.successRate) < 80 ? `<li>🔧 Melhorar cobertura de testes (atual: ${data.summary.successRate}%)</li>` : ''}
                ${parseFloat(data.summary.successRate) >= 90 ? `<li>🎉 Excelente cobertura de testes (${data.summary.successRate}%)</li>` : ''}
                ${parseFloat(data.summary.successRate) >= 80 && parseFloat(data.summary.successRate) < 90 ? `<li>✅ Boa cobertura de testes (${data.summary.successRate}%)</li>` : ''}
            </ul>
        </div>
        
        <div class="timestamp">
            Relatório gerado automaticamente pelo sistema de testes do Event Team Sync
        </div>
    </div>
</body>
</html>`;

    const htmlPath = path.join(process.cwd(), 'frontend-tests-report.html');
    fs.writeFileSync(htmlPath, html);
    console.log(`📄 Relatório HTML salvo em: ${htmlPath}`);
  }

  async runAllTests() {
    console.log('🚀 Iniciando execução completa de todos os testes do frontend...');
    console.log('='.repeat(60));
    
    const startTime = Date.now();
    
    try {
      // Executar todos os tipos de testes
      await this.runUnitTests();
      await this.runAutomatedTests();
      await this.runChromeDevToolsTests();
      
      // Calcular resumo
      this.calculateSummary();
      
      // Gerar relatório final
      this.generateFinalReport();
      
      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);
      
      console.log(`\n⏱️ Tempo total de execução: ${duration}s`);
      console.log('✅ Execução de todos os testes concluída!');
      
    } catch (error) {
      console.error('❌ Erro durante execução dos testes:', error);
    }
  }
}

// Executar se o script for chamado diretamente
if (require.main === module) {
  const runner = new AllTestsRunner();
  runner.runAllTests().catch(console.error);
}

module.exports = AllTestsRunner;

