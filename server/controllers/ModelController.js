// Model controller for handling AI code generation requests
class ModelController {
  // Process prompt and generate code
  static async generateCode(req, res) {
    try {
      const { prompt, currentCode, roomId } = req.body;

      if (!prompt || !roomId) {
        return res.status(400).json({
          success: false,
          message: "Prompt and room ID are required",
        });
      }

      // Simulate AI model processing
      // In a real implementation, this would call an actual AI model API
      const generatedCode = await ModelController.processPromptWithModel(
        prompt,
        currentCode || ""
      );

      res.json({
        success: true,
        generatedCode,
        message: "Code generated successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to generate code",
        error: error.message,
      });
    }
  }

  // Simulate AI model processing
  // In production, replace this with actual AI model API calls
  static async processPromptWithModel(prompt, currentCode) {
    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Simple rule-based code generation for demonstration
    // In production, this would be replaced with actual AI model calls
    let generatedCode = currentCode;

    if (
      prompt.toLowerCase().includes("function") ||
      prompt.toLowerCase().includes("create")
    ) {
      if (prompt.toLowerCase().includes("hello")) {
        generatedCode = `function hello() {
  console.log("Hello, World!");
}

hello();`;
      } else if (prompt.toLowerCase().includes("calculator")) {
        generatedCode = `function calculator(a, b, operation) {
  switch(operation) {
    case '+':
      return a + b;
    case '-':
      return a - b;
    case '*':
      return a * b;
    case '/':
      return b !== 0 ? a / b : 'Error: Division by zero';
    default:
      return 'Error: Invalid operation';
  }
}

// Example usage
console.log(calculator(5, 3, '+')); // Output: 8
console.log(calculator(10, 2, '/')); // Output: 5`;
      } else if (
        prompt.toLowerCase().includes("array") ||
        prompt.toLowerCase().includes("list")
      ) {
        generatedCode = `// Array operations example
const numbers = [1, 2, 3, 4, 5];

// Map function
const doubled = numbers.map(num => num * 2);
console.log('Doubled:', doubled);

// Filter function
const evenNumbers = numbers.filter(num => num % 2 === 0);
console.log('Even numbers:', evenNumbers);

// Reduce function
const sum = numbers.reduce((acc, num) => acc + num, 0);
console.log('Sum:', sum);`;
      } else {
        generatedCode = `// Generated code based on prompt: "${prompt}"
function generatedFunction() {
  // TODO: Implement functionality based on prompt
  console.log("Function created from prompt");
}

generatedFunction();`;
      }
    } else if (
      prompt.toLowerCase().includes("class") ||
      prompt.toLowerCase().includes("object")
    ) {
      generatedCode = `class ExampleClass {
  constructor(name) {
    this.name = name;
  }

  greet() {
    return \`Hello, \${this.name}!\`;
  }

  static createInstance(name) {
    return new ExampleClass(name);
  }
}

// Usage
const instance = new ExampleClass("World");
console.log(instance.greet());`;
    } else if (
      prompt.toLowerCase().includes("async") ||
      prompt.toLowerCase().includes("promise")
    ) {
      generatedCode = `// Async/await example
async function fetchData() {
  try {
    const response = await fetch('https://api.example.com/data');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
}

// Promise example
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function example() {
  console.log('Starting...');
  await delay(1000);
  console.log('Done!');
}

example();`;
    } else {
      // Default response for unrecognized prompts
      generatedCode = `// Code generated from prompt: "${prompt}"
// This is a placeholder implementation
// Please provide more specific instructions for better code generation

console.log("Generated code placeholder");
console.log("Prompt was:", "${prompt}");`;
    }

    return generatedCode;
  }

  // Validate generated code (basic syntax check)
  static validateCode(code) {
    try {
      // Basic validation - check for balanced braces and parentheses
      const openBraces = (code.match(/\{/g) || []).length;
      const closeBraces = (code.match(/\}/g) || []).length;
      const openParens = (code.match(/\(/g) || []).length;
      const closeParens = (code.match(/\)/g) || []).length;

      if (openBraces !== closeBraces || openParens !== closeParens) {
        return {
          isValid: false,
          error: "Unbalanced braces or parentheses",
        };
      }

      return {
        isValid: true,
        error: null,
      };
    } catch (error) {
      return {
        isValid: false,
        error: error.message,
      };
    }
  }
}

module.exports = ModelController;
