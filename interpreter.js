import { Memory } from "./memory.js";
import { Calculator } from "./calculator.js";
export const Interpreter = {
    parseBlocks(container) {
        return Array.from(container.children).map(block => {
            const type = block.dataset.type;
            const data = { type };

            switch (type) {
                case 'declare':
                    data.names = block.querySelector('.var-names').value;
                    break
                case 'assign':
                    data.target = block.querySelector('.var-target').value;
                    data.expr = block.querySelector('.expression').value;
                    break
                case 'if':
                    data.leftExpr = block.querySelector('.cond-left').value;
                    data.op = block.querySelector('.cond-op').value;
                    data.rightExpr = block.querySelector('.cond-right').value;
                    data.subProgram = this.parseBlocks(block.querySelector('.sub-blocks'));
                    break
                case 'while':
                    data.leftExpr = block.querySelector('.cond-left').value;
                    data.op = block.querySelector('.cond-op').value;
                    data.rightExpr = block.querySelector('.cond-right').value;
                    data.subProgram = this.parseBlocks(block.querySelector('.sub-blocks'));
                    break
            }
            return data;
        });
    },

    async run(program) {
        for (const node of program) {
            switch (node.type) {
                case 'declare':
                    node.names.split(',').forEach(n => Memory.set(n, 0));
                    break;
                case 'assign':
                    const val = Calculator.evaluate(node.expr);
                    Memory.set(node.target, val);
                    break;
                case 'if':
                    const left = Calculator.evaluate(node.leftExpr);
                    const right = Calculator.evaluate(node.rightExpr);
                    let condition = false;
                    switch (node.op) {
                        case '>': condition = left > right; break;
                        case '<': condition = left < right; break;
                        case '=': condition = left === right; break;
                        case '!=': condition = left !== right; break;
                    }
                    if (condition) await this.run(node.subProgram);
                    break;
                case 'while':
                    let conditionN = true;
                    while (conditionN){
                        const leftN = Calculator.evaluate(node.leftExpr);
                        const rightN = Calculator.evaluate(node.rightExpr);
                        switch (node.op) {
                            case '>': conditionN = leftN > rightN; break;
                            case '<': conditionN = leftN < rightN; break;
                            case '=': conditionN = leftN === rightN; break;
                            case '!=': conditionN = leftN !== rightN; break;
                        }
                        if(conditionN) await this.run(node.subProgram)
                    };
                    break;
            }
        }
    }
};
