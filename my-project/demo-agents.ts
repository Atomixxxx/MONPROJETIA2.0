// demo-agents.ts
// This file contains demo agents for testing or demonstration purposes.

// Example of a simple demo agent
class DemoAgent {
    constructor(public name: string) {}

    greet() {
        console.log(`Hello, I am ${this.name}, a demo agent!`);
    }
}

// Create instances of demo agents
const agent1 = new DemoAgent("Agent 1");
const agent2 = new DemoAgent("Agent 2");

// Demonstrate agent functionality
agent1.greet();
agent2.greet();