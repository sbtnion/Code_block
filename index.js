let draggedElement = null;

    document.addEventListener('dragstart', (e) => {
        if (e.target.classList.contains('block')) {
            draggedElement = e.target;
            e.target.style.opacity = '0.5';
        }
    });

    document.addEventListener('dragend', (e) => {
        if (e.target.classList.contains('block')) {
            e.target.style.opacity = '1';
        }
    });

    document.addEventListener('dragover', (e) => {
        e.preventDefault(); 
    });

    document.addEventListener('drop', (e) => {
        e.preventDefault();
        const dropZone = e.target.closest('[data-container="true"]');
        
        if (dropZone && draggedElement) {
            if (draggedElement.parentElement.id === 'toolbox') {
                const clone = draggedElement.cloneNode(true);
                clone.style.opacity = '1';
                dropZone.appendChild(clone);
            } else {
                dropZone.appendChild(draggedElement);
            }
        }
    });

const Memory = {
    variables: {},
    reset() { this.variables = {}; },
    set(name, val) { this.variables[name.trim()] = Math.trunc(val); },
    get(name) {
        if (!(name.trim() in this.variables)) throw new Error(`Переменная "${name}" не объявлена!`);
        return this.variables[name.trim()];
    }
};

const Calculator = {
    tokenize(str) {
        return str.replace(/\s+/g, '').match(/\d+|[a-zA-Zа-яА-Я]+|[\+\-\*\/\%\(\)]/g) || [];
    },
    sorting(tokens) {
        const output = [];
        const stack = [];
        const ops = { '+': 1, '-': 1, '*': 2, '/': 2, '%': 2 };

        tokens.forEach(token => {
            if (/\d+/.test(token)) output.push({ type: 'int', val: parseInt(token) });
            else if (/[a-zA-Zа-яА-Я]/.test(token)) output.push({ type: 'var', val: token });
            else if (token === '(') stack.push(token);
            else if (token === ')') {
                while (stack.length && stack[stack.length - 1] !== '(') output.push(stack.pop());
                stack.pop();
            } else {
                while (stack.length && ops[stack[stack.length - 1]] >= ops[token]) output.push(stack.pop());
                stack.push(token);
            }
        });
        while (stack.length) output.push(stack.pop());
        return output;
    },

    evaluate(expressionStr) {
        const tokens = this.tokenize(expressionStr);
        const rps = this.sorting(tokens);
        const stack = [];

        rps.forEach(node => {
            if (node.type === 'int') stack.push(node.val);
            else if (node.type === 'var') stack.push(Memory.get(node.val));
            else {
                const b = stack.pop();
                const a = stack.pop();
                switch (node) {
                    case '+': stack.push(a + b); break;
                    case '-': stack.push(a - b); break;
                    case '*': stack.push(a * b); break;
                    case '/': stack.push(b === 0 ? 0 : Math.trunc(a / b)); break;
                    case '%': stack.push(b === 0 ? 0 : a % b); break;
                }
            }
        });
        return stack[0] || 0;
    }
}


const Interpreter = {
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
            }
        }
    }
};


document.getElementById('run-btn').addEventListener('click', async () => {
    try {
        Memory.reset();
        const program = Interpreter.parseBlocks(document.getElementById('workspace'));
        await Interpreter.run(program);
        console.log("Результат выполнения:", Memory.variables);
        alert("Успешно! Состояние памяти: " + JSON.stringify(Memory.variables));
    } catch (e) {
        alert("Ошибка: " + e.message);
    }
});
