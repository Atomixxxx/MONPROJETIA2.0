import { ExecutionResult } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { apiService } from './api';

export class CodeExecutionService {
  private maxExecutionTime = 30000; // 30 secondes
  private executionTimeout: NodeJS.Timeout | null = null;
  private useApi = import.meta.env.VITE_ENABLE_MOCK !== 'true';

  async executeCode(code: string, language: string): Promise<ExecutionResult> {
    if (this.useApi) {
      return await apiService.executeCode(code, language);
    }
    
    const startTime = Date.now();
    const executionId = uuidv4();

    return new Promise((resolve) => {
      // Simuler l'exécution avec timeout
      this.executionTimeout = setTimeout(() => {
        resolve({
          id: executionId,
          code,
          output: '',
          errors: 'Execution timeout: Code execution exceeded 30 seconds limit',
          duration: this.maxExecutionTime,
          timestamp: new Date(),
          language,
          status: 'timeout'
        });
      }, this.maxExecutionTime);

      // Simuler le résultat d'exécution
      setTimeout(() => {
        if (this.executionTimeout) {
          clearTimeout(this.executionTimeout);
        }

        const duration = Date.now() - startTime;
        const result = this.simulateExecution(code, language, executionId, duration);
        resolve(result);
      }, Math.random() * 2000 + 500); // 500ms à 2.5s
    });
  }

  private simulateExecution(code: string, language: string, id: string, duration: number): ExecutionResult {
    const hasError = code.includes('error') || code.includes('raise') || code.includes('throw');
    const isEmpty = code.trim().length === 0;

    if (isEmpty) {
      return {
        id,
        code,
        output: '',
        errors: 'No code to execute',
        duration,
        timestamp: new Date(),
        language,
        status: 'error'
      };
    }

    if (hasError) {
      return {
        id,
        code,
        output: '',
        errors: `${language === 'python' ? 'Python' : 'JavaScript'} execution error: Simulated error in code`,
        duration,
        timestamp: new Date(),
        language,
        status: 'error'
      };
    }

    // Simuler une sortie basée sur le contenu
    let output = '';
    if (code.includes('print') || code.includes('console.log')) {
      output = '=== Plateforme IA Collaborative ===\n';
      output += 'Code executed successfully!\n';
      
      if (code.includes('fibonacci')) {
        output += 'Calcul de la suite de Fibonacci\n';
        output += 'F(0) = 0\nF(1) = 1\nF(2) = 1\nF(3) = 2\nF(4) = 3\n';
        output += 'F(5) = 5\nF(6) = 8\nF(7) = 13\nF(8) = 21\nF(9) = 34\n';
      }
      
      output += '\nExécution terminée avec succès!';
    } else {
      output = `Code executed successfully in ${duration}ms`;
    }

    return {
      id,
      code,
      output,
      errors: '',
      duration,
      timestamp: new Date(),
      language,
      status: 'success'
    };
  }

  killExecution(): void {
    if (this.executionTimeout) {
      clearTimeout(this.executionTimeout);
      this.executionTimeout = null;
    }
  }
}