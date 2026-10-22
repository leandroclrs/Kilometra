/**
 * Módulo de Cadastro e Gestão de Veículos
 * Cria um objeto representando um veículo do cliente.
 * @param {string} nome - Nome ou apelido do carro (ex: "Meu Argo", "Clio do Trabalho").
 * @param {string} marca - Marca do veículo (ex: "Fiat", "Renault").
 * @param {number} ano - Ano de fabricação/modelo (ex: 2025).
 * @param {string|number} cilindradaMotor - Cilindrada do motor (ex: "1.0", "1.6", "2.0").
 * @param {string} placa - Placa do veículo (utilizada como identificador único).
 * @returns {Object} Objeto estruturado do veículo.
 */
function cadastrarVeiculo(nome, marca, ano, cilindradaMotor, placa) {
    if (!placa || typeof placa !== 'string' || placa.trim() === '') {
        throw new Error("A placa do veículo é obrigatória e deve ser válida.");
    }
    return {
        id: placa.toUpperCase().trim(),
        nome: nome || "Veículo Sem Nome",
        marca: marca || "Desconhecida",
        ano: Number(ano) || 0,
        cilindradaMotor: String(cilindradaMotor) || "1.0",
        placa: placa.toUpperCase().trim()
    };
}


// =========================================================================
// INTEGRAÇÃO ADICIONADA ABAIXO (Sem alterar a função original acima)
// =========================================================================
const fs = require('fs');
const readline = require('readline');

// Nova função para salvar o resultado da sua função cadastrarVeiculo() no JSON
function salvarVeiculo(novoVeiculo) {
    let veiculos = [];
    
    if (fs.existsSync('veiculos.json')) {
        try {
            const data = fs.readFileSync('veiculos.json', 'utf8');
            if (data.trim() !== '') {
                veiculos = JSON.parse(data);
            }
        } catch (err) {
            console.error("Erro ao ler o histórico de veículos.");
        }
    }
    
    veiculos.push(novoVeiculo);
    fs.writeFileSync('veiculos.json', JSON.stringify(veiculos, null, 4), 'utf8');
    console.log(`\n✅ Veículo "${novoVeiculo.nome}" salvo com sucesso no arquivo veiculos.json!`);
}

// Interface opcional de terminal (CLI) para preencher os dados facilmente
function iniciarCadastroCLI() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    console.log("=== Novo Registro de Veículo ===");
    rl.question('Nome/Apelido do carro (ex: Meu Argo): ', (nome) => {
        rl.question('Marca (ex: Fiat): ', (marca) => {
            rl.question('Ano (ex: 2025): ', (ano) => {
                rl.question('Cilindrada (ex: 1.0): ', (cilindrada) => {
                    rl.question('Placa (ex: ABC-1234): ', (placa) => {
                        try {
                            // 1. Gera o objeto chamando a SUA função original
                            const veiculo = cadastrarVeiculo(nome, marca, ano, cilindrada, placa);
                            
                            // 2. Salva no disco chamando a nova função
                            salvarVeiculo(veiculo);
                        } catch (e) {
                            console.error("\n❌ Erro ao cadastrar:", e.message);
                        }
                        rl.close();
                    });
                });
            });
        });
    });
}

// Descomente a linha abaixo para habilitar o modo interativo via terminal executando 'node RegistrarVeiculo.js'
iniciarCadastroCLI();

// Exporta as funções para serem usadas em outros lugares, se necessário
module.exports = { cadastrarVeiculo, salvarVeiculo, iniciarCadastroCLI };
