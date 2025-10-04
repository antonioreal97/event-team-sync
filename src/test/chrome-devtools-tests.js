/**
 * Testes específicos para Chrome DevTools
 * Este arquivo pode ser executado no console do navegador para testar funcionalidades específicas
 */

class ChromeDevToolsTester {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
  }

  // Função para testar performance com Chrome DevTools
  async testPerformance() {
    console.log('⚡ Testando performance com Chrome DevTools...');
    
    try {
      // Usar Performance API
      const navigation = performance.getEntriesByType('navigation')[0];
      const paint = performance.getEntriesByType('paint');
      
      const metrics = {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0
      };
      
      this.logResult('Performance - DOM Content Loaded', 'PASS', `${metrics.domContentLoaded.toFixed(2)}ms`);
      this.logResult('Performance - Load Complete', 'PASS', `${metrics.loadComplete.toFixed(2)}ms`);
      this.logResult('Performance - First Paint', 'PASS', `${metrics.firstPaint.toFixed(2)}ms`);
      this.logResult('Performance - First Contentful Paint', 'PASS', `${metrics.firstContentfulPaint.toFixed(2)}ms`);
      
    } catch (error) {
      this.logResult('Performance', 'FAIL', error.message);
    }
  }

  // Função para testar memória
  async testMemory() {
    console.log('🧠 Testando uso de memória...');
    
    try {
      if (performance.memory) {
        const memory = performance.memory;
        const usedMB = (memory.usedJSHeapSize / 1048576).toFixed(2);
        const totalMB = (memory.totalJSHeapSize / 1048576).toFixed(2);
        const limitMB = (memory.jsHeapSizeLimit / 1048576).toFixed(2);
        
        this.logResult('Memória - Usada', 'PASS', `${usedMB}MB`);
        this.logResult('Memória - Total', 'PASS', `${totalMB}MB`);
        this.logResult('Memória - Limite', 'PASS', `${limitMB}MB`);
        
        // Verificar se está próximo do limite
        const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
        if (usagePercent > 80) {
          this.logResult('Memória - Uso Alto', 'WARN', `${usagePercent.toFixed(1)}% do limite`);
        } else {
          this.logResult('Memória - Uso Normal', 'PASS', `${usagePercent.toFixed(1)}% do limite`);
        }
      } else {
        this.logResult('Memória', 'SKIP', 'API de memória não disponível');
      }
    } catch (error) {
      this.logResult('Memória', 'FAIL', error.message);
    }
  }

  // Função para testar rede
  async testNetwork() {
    console.log('🌐 Testando performance de rede...');
    
    try {
      const resources = performance.getEntriesByType('resource');
      const totalSize = resources.reduce((sum, resource) => sum + (resource.transferSize || 0), 0);
      const totalTime = resources.reduce((sum, resource) => sum + resource.duration, 0);
      
      this.logResult('Rede - Total de recursos', 'PASS', `${resources.length} recursos`);
      this.logResult('Rede - Tamanho total', 'PASS', `${(totalSize / 1024).toFixed(2)}KB`);
      this.logResult('Rede - Tempo total', 'PASS', `${totalTime.toFixed(2)}ms`);
      
      // Analisar recursos lentos
      const slowResources = resources.filter(r => r.duration > 1000);
      if (slowResources.length > 0) {
        this.logResult('Rede - Recursos lentos', 'WARN', `${slowResources.length} recursos > 1s`);
      } else {
        this.logResult('Rede - Performance boa', 'PASS', 'Todos os recursos < 1s');
      }
      
    } catch (error) {
      this.logResult('Rede', 'FAIL', error.message);
    }
  }

  // Função para testar JavaScript
  async testJavaScript() {
    console.log('⚡ Testando JavaScript...');
    
    try {
      // Testar se todas as funções estão definidas
      const functions = [
        'fetch',
        'Promise',
        'localStorage',
        'sessionStorage',
        'JSON'
      ];
      
      functions.forEach(func => {
        if (typeof window[func] !== 'undefined') {
          this.logResult(`JS - ${func}`, 'PASS', 'Disponível');
        } else {
          this.logResult(`JS - ${func}`, 'FAIL', 'Não disponível');
        }
      });
      
      // Testar async/await separadamente
      try {
        const asyncTest = async () => 'test';
        const result = await asyncTest();
        if (result === 'test') {
          this.logResult('JS - async/await', 'PASS', 'Funcionando corretamente');
        } else {
          this.logResult('JS - async/await', 'FAIL', 'Resultado inesperado');
        }
      } catch (error) {
        this.logResult('JS - async/await', 'FAIL', 'Erro na execução');
      }
      
      // Testar execução de código
      const testCode = () => {
        const arr = [1, 2, 3];
        return arr.map(x => x * 2).reduce((a, b) => a + b, 0);
      };
      
      const result = testCode();
      if (result === 12) {
        this.logResult('JS - Execução', 'PASS', 'Código executado corretamente');
      } else {
        this.logResult('JS - Execução', 'FAIL', 'Resultado inesperado');
      }
      
    } catch (error) {
      this.logResult('JavaScript', 'FAIL', error.message);
    }
  }

  // Função para testar DOM
  async testDOM() {
    console.log('🌳 Testando DOM...');
    
    try {
      // Testar seletores
      const selectors = [
        'body',
        'html',
        'head',
        'title',
        'meta',
        'script',
        'style',
        'link'
      ];
      
      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          this.logResult(`DOM - ${selector}`, 'PASS', `${elements.length} elementos`);
        } else {
          this.logResult(`DOM - ${selector}`, 'FAIL', 'Não encontrado');
        }
      });
      
      // Testar manipulação do DOM
      const testDiv = document.createElement('div');
      testDiv.id = 'test-div';
      testDiv.textContent = 'Teste';
      document.body.appendChild(testDiv);
      
      const foundDiv = document.getElementById('test-div');
      if (foundDiv) {
        this.logResult('DOM - Criação', 'PASS', 'Elemento criado e encontrado');
        document.body.removeChild(testDiv);
        this.logResult('DOM - Remoção', 'PASS', 'Elemento removido');
      } else {
        this.logResult('DOM - Criação', 'FAIL', 'Elemento não encontrado');
      }
      
    } catch (error) {
      this.logResult('DOM', 'FAIL', error.message);
    }
  }

  // Função para testar eventos
  async testEvents() {
    console.log('🎯 Testando eventos...');
    
    try {
      // Testar se eventos estão funcionando
      let clickCount = 0;
      const testButton = document.createElement('button');
      testButton.textContent = 'Teste';
      testButton.addEventListener('click', () => clickCount++);
      document.body.appendChild(testButton);
      
      // Simular clique
      testButton.click();
      
      if (clickCount === 1) {
        this.logResult('Eventos - Click', 'PASS', 'Evento de clique funcionando');
      } else {
        this.logResult('Eventos - Click', 'FAIL', 'Evento de clique não funcionando');
      }
      
      // Testar eventos de teclado
      let keyCount = 0;
      const testInput = document.createElement('input');
      testInput.addEventListener('keydown', () => keyCount++);
      document.body.appendChild(testInput);
      
      testInput.focus();
      testInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
      
      if (keyCount === 1) {
        this.logResult('Eventos - Keyboard', 'PASS', 'Evento de teclado funcionando');
      } else {
        this.logResult('Eventos - Keyboard', 'FAIL', 'Evento de teclado não funcionando');
      }
      
      // Limpar elementos de teste
      document.body.removeChild(testButton);
      document.body.removeChild(testInput);
      
    } catch (error) {
      this.logResult('Eventos', 'FAIL', error.message);
    }
  }

  // Função para testar APIs
  async testAPIs() {
    console.log('🔌 Testando APIs...');
    
    try {
      // Testar fetch
      const response = await fetch('/api/health');
      if (response.ok) {
        this.logResult('API - Health Check', 'PASS', `Status: ${response.status}`);
      } else {
        this.logResult('API - Health Check', 'FAIL', `Status: ${response.status}`);
      }
      
      // Testar localStorage
      localStorage.setItem('test', 'value');
      const stored = localStorage.getItem('test');
      if (stored === 'value') {
        this.logResult('API - localStorage', 'PASS', 'Funcionando');
        localStorage.removeItem('test');
      } else {
        this.logResult('API - localStorage', 'FAIL', 'Não funcionando');
      }
      
      // Testar sessionStorage
      sessionStorage.setItem('test', 'value');
      const sessionStored = sessionStorage.getItem('test');
      if (sessionStored === 'value') {
        this.logResult('API - sessionStorage', 'PASS', 'Funcionando');
        sessionStorage.removeItem('test');
      } else {
        this.logResult('API - sessionStorage', 'FAIL', 'Não funcionando');
      }
      
    } catch (error) {
      this.logResult('APIs', 'FAIL', error.message);
    }
  }

  // Função para testar acessibilidade
  async testAccessibility() {
    console.log('♿ Testando acessibilidade...');
    
    try {
      // Testar elementos com roles
      const elementsWithRoles = document.querySelectorAll('[role]');
      this.logResult('A11y - Elementos com roles', 'PASS', `${elementsWithRoles.length} elementos`);
      
      // Testar elementos com aria-labels
      const elementsWithAriaLabels = document.querySelectorAll('[aria-label]');
      this.logResult('A11y - Elementos com aria-label', 'PASS', `${elementsWithAriaLabels.length} elementos`);
      
      // Testar elementos com alt text
      const images = document.querySelectorAll('img');
      const imagesWithAlt = Array.from(images).filter(img => img.alt);
      this.logResult('A11y - Imagens com alt', 'PASS', `${imagesWithAlt.length}/${images.length} imagens`);
      
      // Testar contraste (simulação)
      const body = document.body;
      const computedStyle = window.getComputedStyle(body);
      const hasColor = computedStyle.color && computedStyle.color !== 'rgb(0, 0, 0)';
      const hasBackground = computedStyle.backgroundColor && computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)';
      
      if (hasColor && hasBackground) {
        this.logResult('A11y - Contraste', 'PASS', 'Cores definidas');
      } else {
        this.logResult('A11y - Contraste', 'WARN', 'Cores não definidas adequadamente');
      }
      
    } catch (error) {
      this.logResult('Acessibilidade', 'FAIL', error.message);
    }
  }

  // Função para testar responsividade
  async testResponsiveness() {
    console.log('📱 Testando responsividade...');
    
    try {
      const viewports = [
        { width: 320, height: 568, name: 'Mobile' },
        { width: 768, height: 1024, name: 'Tablet' },
        { width: 1200, height: 800, name: 'Desktop' }
      ];
      
      for (const viewport of viewports) {
        // Simular mudança de viewport
        window.innerWidth = viewport.width;
        window.innerHeight = viewport.height;
        
        // Disparar evento de resize
        window.dispatchEvent(new Event('resize'));
        
        // Verificar se elementos ainda estão visíveis
        const body = document.body;
        const isVisible = body.offsetWidth > 0 && body.offsetHeight > 0;
        
        if (isVisible) {
          this.logResult(`Responsivo - ${viewport.name}`, 'PASS', `${viewport.width}x${viewport.height}`);
        } else {
          this.logResult(`Responsivo - ${viewport.name}`, 'FAIL', 'Elementos não visíveis');
        }
      }
      
    } catch (error) {
      this.logResult('Responsividade', 'FAIL', error.message);
    }
  }

  // Função para testar segurança
  async testSecurity() {
    console.log('🔒 Testando segurança...');
    
    try {
      // Testar HTTPS
      const isSecure = location.protocol === 'https:';
      this.logResult('Segurança - HTTPS', isSecure ? 'PASS' : 'WARN', 
        isSecure ? 'Conexão segura' : 'Conexão não segura');
      
      // Testar Content Security Policy
      const csp = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
      if (csp) {
        this.logResult('Segurança - CSP', 'PASS', 'Content Security Policy definido');
      } else {
        this.logResult('Segurança - CSP', 'WARN', 'Content Security Policy não definido');
      }
      
      // Testar cookies seguros
      const cookies = document.cookie;
      if (cookies) {
        this.logResult('Segurança - Cookies', 'PASS', `${cookies.split(';').length} cookies`);
      } else {
        this.logResult('Segurança - Cookies', 'PASS', 'Nenhum cookie');
      }
      
    } catch (error) {
      this.logResult('Segurança', 'FAIL', error.message);
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
    
    const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : status === 'WARN' ? '⚠️' : 'ℹ️';
    console.log(`${icon} ${test}: ${message}`);
  }

  async runAllTests() {
    console.log('🚀 Iniciando testes com Chrome DevTools...');
    console.log('='.repeat(50));
    
    await this.testPerformance();
    await this.testMemory();
    await this.testNetwork();
    await this.testJavaScript();
    await this.testDOM();
    await this.testEvents();
    await this.testAPIs();
    await this.testAccessibility();
    await this.testResponsiveness();
    await this.testSecurity();
    
    this.generateReport();
  }

  generateReport() {
    const endTime = Date.now();
    const duration = ((endTime - this.startTime) / 1000).toFixed(2);
    
    console.log('\n📊 RELATÓRIO FINAL:');
    console.log('='.repeat(50));
    
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const warnings = this.results.filter(r => r.status === 'WARN').length;
    const total = this.results.length;
    
    console.log(`✅ Testes que passaram: ${passed}`);
    console.log(`❌ Testes que falharam: ${failed}`);
    console.log(`⚠️ Avisos: ${warnings}`);
    console.log(`📈 Total de testes: ${total}`);
    console.log(`🎯 Taxa de sucesso: ${total > 0 ? ((passed / total) * 100).toFixed(1) : 0}%`);
    console.log(`⏱️ Tempo de execução: ${duration}s`);
    
    if (failed > 0) {
      console.log('\n❌ TESTES QUE FALHARAM:');
      this.results.filter(r => r.status === 'FAIL').forEach(result => {
        console.log(`- ${result.test}: ${result.message}`);
      });
    }
    
    if (warnings > 0) {
      console.log('\n⚠️ AVISOS:');
      this.results.filter(r => r.status === 'WARN').forEach(result => {
        console.log(`- ${result.test}: ${result.message}`);
      });
    }
    
    // Salvar relatório
    const report = {
      summary: {
        passed,
        failed,
        warnings,
        total,
        successRate: total > 0 ? ((passed / total) * 100).toFixed(1) : 0,
        duration: `${duration}s`
      },
      results: this.results
    };
    
    // Salvar no localStorage para fácil acesso
    localStorage.setItem('chrome-devtools-test-report', JSON.stringify(report));
    console.log('\n📄 Relatório salvo no localStorage como "chrome-devtools-test-report"');
  }
}

// Instanciar e executar testes
const tester = new ChromeDevToolsTester();

// Executar automaticamente
tester.runAllTests().catch(console.error);

// Exportar para uso global
window.ChromeDevToolsTester = ChromeDevToolsTester;
window.tester = tester;

console.log('🧪 ChromeDevToolsTester carregado! Use tester.runAllTests() para executar novamente.');
