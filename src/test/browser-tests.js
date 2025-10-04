// Testes de funcionalidades do frontend para execução no navegador
// Este arquivo pode ser carregado no console do navegador para testar funcionalidades

class FrontendTester {
  constructor() {
    this.tests = [];
    this.results = [];
  }

  // Função para testar se elementos estão presentes na página
  testElementExists(selector, description) {
    const element = document.querySelector(selector);
    const result = {
      test: description,
      passed: !!element,
      element: element,
      selector: selector
    };
    this.results.push(result);
    console.log(`${result.passed ? '✅' : '❌'} ${description}: ${result.passed ? 'PASS' : 'FAIL'}`);
    return result;
  }

  // Função para testar se texto está presente
  testTextExists(text, description) {
    const found = document.body.textContent.includes(text);
    const result = {
      test: description,
      passed: found,
      text: text
    };
    this.results.push(result);
    console.log(`${result.passed ? '✅' : '❌'} ${description}: ${result.passed ? 'PASS' : 'FAIL'}`);
    return result;
  }

  // Função para testar cliques em elementos
  async testClick(selector, description) {
    const element = document.querySelector(selector);
    if (!element) {
      const result = {
        test: description,
        passed: false,
        error: 'Element not found'
      };
      this.results.push(result);
      console.log(`❌ ${description}: FAIL - Element not found`);
      return result;
    }

    try {
      element.click();
      const result = {
        test: description,
        passed: true,
        element: element
      };
      this.results.push(result);
      console.log(`✅ ${description}: PASS`);
      return result;
    } catch (error) {
      const result = {
        test: description,
        passed: false,
        error: error.message
      };
      this.results.push(result);
      console.log(`❌ ${description}: FAIL - ${error.message}`);
      return result;
    }
  }

  // Função para testar formulários
  async testFormFill(formSelector, data, description) {
    const form = document.querySelector(formSelector);
    if (!form) {
      const result = {
        test: description,
        passed: false,
        error: 'Form not found'
      };
      this.results.push(result);
      console.log(`❌ ${description}: FAIL - Form not found`);
      return result;
    }

    try {
      for (const [name, value] of Object.entries(data)) {
        const input = form.querySelector(`[name="${name}"]`);
        if (input) {
          input.value = value;
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }
      
      const result = {
        test: description,
        passed: true,
        form: form,
        data: data
      };
      this.results.push(result);
      console.log(`✅ ${description}: PASS`);
      return result;
    } catch (error) {
      const result = {
        test: description,
        passed: false,
        error: error.message
      };
      this.results.push(result);
      console.log(`❌ ${description}: FAIL - ${error.message}`);
      return result;
    }
  }

  // Função para testar navegação
  testNavigation(expectedUrl, description) {
    const currentUrl = window.location.href;
    const passed = currentUrl.includes(expectedUrl);
    const result = {
      test: description,
      passed: passed,
      currentUrl: currentUrl,
      expectedUrl: expectedUrl
    };
    this.results.push(result);
    console.log(`${result.passed ? '✅' : '❌'} ${description}: ${result.passed ? 'PASS' : 'FAIL'}`);
    return result;
  }

  // Função para testar localStorage
  testLocalStorage(key, expectedValue, description) {
    const value = localStorage.getItem(key);
    const passed = value === expectedValue;
    const result = {
      test: description,
      passed: passed,
      actualValue: value,
      expectedValue: expectedValue
    };
    this.results.push(result);
    console.log(`${result.passed ? '✅' : '❌'} ${description}: ${result.passed ? 'PASS' : 'FAIL'}`);
    return result;
  }

  // Função para testar se API está respondendo
  async testApiCall(url, method = 'GET', description) {
    try {
      const response = await fetch(url, { method });
      const result = {
        test: description,
        passed: response.ok,
        status: response.status,
        url: url
      };
      this.results.push(result);
      console.log(`${result.passed ? '✅' : '❌'} ${description}: ${result.passed ? 'PASS' : 'FAIL'} (Status: ${response.status})`);
      return result;
    } catch (error) {
      const result = {
        test: description,
        passed: false,
        error: error.message,
        url: url
      };
      this.results.push(result);
      console.log(`❌ ${description}: FAIL - ${error.message}`);
      return result;
    }
  }

  // Função para executar todos os testes
  async runAllTests() {
    console.log('🚀 Iniciando testes do frontend...');
    console.log('='.repeat(50));

    // Testes básicos de elementos
    this.testElementExists('body', 'Página carregada');
    this.testElementExists('main', 'Elemento main presente');
    this.testElementExists('header', 'Header presente');
    this.testElementExists('nav', 'Navegação presente');

    // Testes de texto
    this.testTextExists('Event Team Sync', 'Título da aplicação presente');
    this.testTextExists('Login', 'Botão de login presente');

    // Testes de API
    await this.testApiCall('/api/health', 'GET', 'API de health check');
    await this.testApiCall('/api/events', 'GET', 'API de eventos');

    // Testes de localStorage
    this.testLocalStorage('token', null, 'Token inicial vazio');

    console.log('='.repeat(50));
    this.printSummary();
  }

  // Função para imprimir resumo dos testes
  printSummary() {
    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    const failed = total - passed;

    console.log('📊 RESUMO DOS TESTES:');
    console.log(`✅ Passou: ${passed}`);
    console.log(`❌ Falhou: ${failed}`);
    console.log(`📈 Total: ${total}`);
    console.log(`🎯 Taxa de sucesso: ${((passed / total) * 100).toFixed(1)}%`);

    if (failed > 0) {
      console.log('\n❌ TESTES QUE FALHARAM:');
      this.results.filter(r => !r.passed).forEach(result => {
        console.log(`- ${result.test}: ${result.error || 'Falhou'}`);
      });
    }
  }

  // Função para testar funcionalidades específicas de eventos
  async testEventFeatures() {
    console.log('🎪 Testando funcionalidades de eventos...');
    
    // Testar se há eventos na página
    this.testElementExists('[data-testid="event-card"]', 'Cards de eventos presentes');
    this.testElementExists('[data-testid="event-list"]', 'Lista de eventos presente');
    
    // Testar botões de ação
    this.testElementExists('[data-testid="create-event-btn"]', 'Botão de criar evento presente');
    this.testElementExists('[data-testid="filter-events"]', 'Filtro de eventos presente');
    
    // Testar formulário de evento
    const createEventBtn = document.querySelector('[data-testid="create-event-btn"]');
    if (createEventBtn) {
      await this.testClick('[data-testid="create-event-btn"]', 'Clicar em criar evento');
      
      // Testar preenchimento do formulário
      await this.testFormFill('form', {
        title: 'Evento de Teste',
        description: 'Descrição do evento de teste',
        startDate: '2024-12-01',
        endDate: '2024-12-02'
      }, 'Preencher formulário de evento');
    }
  }

  // Função para testar funcionalidades de usuário
  async testUserFeatures() {
    console.log('👤 Testando funcionalidades de usuário...');
    
    // Testar login
    this.testElementExists('[data-testid="login-form"]', 'Formulário de login presente');
    this.testElementExists('input[type="email"]', 'Campo de email presente');
    this.testElementExists('input[type="password"]', 'Campo de senha presente');
    
    // Testar preenchimento do login
    await this.testFormFill('[data-testid="login-form"]', {
      email: 'test@example.com',
      password: 'password123'
    }, 'Preencher formulário de login');
  }
}

// Instanciar o testador
const tester = new FrontendTester();

// Executar testes quando a página carregar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    tester.runAllTests();
  });
} else {
  tester.runAllTests();
}

// Exportar para uso global
window.FrontendTester = FrontendTester;
window.tester = tester;

console.log('🧪 FrontendTester carregado! Use tester.runAllTests() para executar todos os testes.');
