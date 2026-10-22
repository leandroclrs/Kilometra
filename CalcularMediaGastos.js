/**
 * Módulo Refatorado de Cálculo de Consumo e Gastos Automotivos.
 * Inclui validação defensiva, ordenação cronológica e suporte a abastecimentos parciais.
 * Valida a estrutura individual de cada registro de abastecimento.
 * @param {Object} registro - Objeto contendo os dados do abastecimento.
 * @returns {boolean} True se o registro contiver dados válidos.
 */
function validarRegistro(registro) {
    if (!registro || typeof registro !== 'object') return false;
    
    const { data, quilometragem, litros, precoLitro } = registro;
    
    const dataValida = !isNaN(Date.parse(data));
    const kmValido = typeof quilometragem === 'number' && quilometragem >= 0;
    const litrosValidos = typeof litros === 'number' && litros > 0;
    const precoValido = typeof precoLitro === 'number' && precoLitro >= 0;
    return dataValida && kmValido && litrosValidos && precoValido;
}

/**
 * Processa o histórico de abastecimentos e gera o relatório consolidado.
 * @param {Array<Object>} historico - Lista de abastecimentos.
 * @returns {Object} Relatório analítico consolidado e detalhado por trecho.
 */
function calcularMediaGastos(historico) {
    if (!Array.isArray(historico) || historico.length < 2) {
        throw new Error("É necessário fornecer uma lista com pelo menos dois registros válidos.");
    }
    const historicoValido = historico.filter(validarRegistro);
    if (historicoValido.length < 2) {
        throw new Error("O histórico não possui registros válidos suficientes após a filtragem.");
    }
    // Ordena o primária por data e secundária por odometria
    const historicoOrdenado = [...historicoValido].sort((a, b) => {
        const diffData = new Date(a.data) - new Date(b.data);
        if (diffData !== 0) return diffData;
        return a.quilometragem - b.quilometragem;
    });
    const detalhesAbastecimentos = [];
    let totalLitrosConsumidosGeral = 0;
    let totalGastoMonetarioGeral = 0;
    let totalDistanciaPercorridaGeral = 0;
    let distanciaAcumuladaParcial = 0;
    let litrosAcumuladosParcial = 0;
    let gastoAcumuladoParcial = 0;
    
    for (let i = 1; i < historicoOrdenado.length; i++) {
        const anterior = historicoOrdenado[i - 1];
        const atual = historicoOrdenado[i];
        const distanciaTrecho = atual.quilometragem - anterior.quilometragem;
        
        if (distanciaTrecho <= 0) {
            console.warn(`Inconsistência de odometria ignorada no dia ${atual.data}.`);
            continue;
        }
        
        const custoTrecho = atual.litros * atual.precoLitro;
        const eTanqueCheio = atual.tanqueCheio !== undefined ? Boolean(atual.tanqueCheio) : true;
        
        distanciaAcumuladaParcial += distanciaTrecho;
        litrosAcumuladosParcial += atual.litros;
        gastoAcumuladoParcial += custoTrecho;
        
        let consumoKmPorL = null;
        let custoPorKm = null;
        
        if (eTanqueCheio) {
            consumoKmPorL = litrosAcumuladosParcial > 0 ? distanciaAcumuladaParcial / litrosAcumuladosParcial : 0;
            custoPorKm = distanciaAcumuladaParcial > 0 ? gastoAcumuladoParcial / distanciaAcumuladaParcial : 0;
            totalDistanciaPercorridaGeral += distanciaAcumuladaParcial;
            totalLitrosConsumidosGeral += litrosAcumuladosParcial;
            totalGastoMonetarioGeral += gastoAcumuladoParcial;
            
            distanciaAcumuladaParcial = 0;
            litrosAcumuladosParcial = 0;
            gastoAcumuladoParcial = 0;
        }
        
        detalhesAbastecimentos.push({
            data: atual.data,
            quilometragem: atual.quilometragem,
            distanciaKm: distanciaTrecho,
            litrosAbastecidos: atual.litros,
            precoPorLitro: atual.precoLitro,
            tanqueCheio: eTanqueCheio,
            gastoTotalAbastecimento: Number(custoTrecho.toFixed(2)),
            consumoKmPorLitro: consumoKmPorL !== null ? Number(consumoKmPorL.toFixed(2)) : 'Parcial (Pendente)',
            custoPorKm: custoPorKm !== null ? Number(custoPorKm.toFixed(4)) : 'Parcial (Pendente)'
        });
    }
    
    if (detalhesAbastecimentos.length === 0) {
        throw new Error("Nenhum trecho válido pôde ser processado com os dados fornecidos.");
    }
    
    const mediaGeralKmPorL = totalLitrosConsumidosGeral > 0 
        ? totalDistanciaPercorridaGeral / totalLitrosConsumidosGeral 
        : 0;
    const custoMedioGeralPorKm = totalDistanciaPercorridaGeral > 0 
        ? totalGastoMonetarioGeral / totalDistanciaPercorridaGeral 
        : 0;
        
    return {
        resumoGeral: {
            distanciaTotalValidaKm: totalDistanciaPercorridaGeral,
            totalLitrosConsumidos: Number(totalLitrosConsumidosGeral.toFixed(2)),
            gastoTotalReais: Number(totalGastoMonetarioGeral.toFixed(2)),
            mediaGeralKmPorLitro: Number(mediaGeralKmPorL.toFixed(2)),
            custoMedioPorKm: Number(custoMedioGeralPorKm.toFixed(4))
        },
        historicoDetalhado: detalhesAbastecimentos
    };
}


// =========================================================================
// INTEGRAÇÃO ADICIONADA ABAIXO (Sem alterar as funções originais acima)
// =========================================================================
const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// 1. Função para ler o arquivo gerado pelo RegistrarVeiculo.js
function carregarVeiculos() {
    try {
        const data = fs.readFileSync('veiculos.json', 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.log("Nenhum veículo encontrado. Execute o RegistrarVeiculo.js primeiro para cadastrar.");
        return [];
    }
}

// 2. Função para exibir o menu e capturar a escolha do cliente
function selecionarVeiculo() {
    const veiculos = carregarVeiculos();

    if (veiculos.length === 0) {
        rl.close();
        return;
    }

    console.log("\n=== Veículos Registrados no Kilometra ===");
    veiculos.forEach((veiculo, index) => {
        // Adaptado para os atributos reais gerados na sua função cadastrarVeiculo()
        console.log(`${index + 1}. ${veiculo.nome} (${veiculo.marca} ${veiculo.ano}) - Placa: ${veiculo.placa}`);
    });

    rl.question('\nDigite o número do veículo que deseja usar para o cálculo: ', (resposta) => {
        const index = parseInt(resposta) - 1;

        if (index >= 0 && index < veiculos.length) {
            const veiculoSelecionado = veiculos[index];
            console.log(`\n✅ Você selecionou: ${veiculoSelecionado.nome} (Placa: ${veiculoSelecionado.placa})`);
            
            // Chama a simulação/entrada de dados para a sua função principal
            iniciarCalculoCLI(veiculoSelecionado);
            
        } else {
            console.log("❌ Opção inválida. Tente novamente.");
            selecionarVeiculo();
        }
    });
}

// 3. Função que conecta o veículo escolhido ao seu processador de histórico (calcularMediaGastos)
function iniciarCalculoCLI(veiculo) {
    console.log(`\nComo o seu módulo exige uma lista de registros, vamos simular dados para testar sua função original com o veículo escolhido:`);
    
    // Este array simularia dados puxados de um banco ou digitados pelo usuário
    const historicoExemplo = [
        { data: '2026-10-01', quilometragem: 10000, litros: 40, precoLitro: 5.50, tanqueCheio: true },
        { data: '2026-10-15', quilometragem: 10400, litros: 38, precoLitro: 5.60, tanqueCheio: true }
    ];

    console.log("Processando histórico em calcularMediaGastos()...");
    try {
        const resultado = calcularMediaGastos(historicoExemplo);
        console.log("\n--- RESULTADO CONSOLIDADO ---");
        console.log(JSON.stringify(resultado, null, 2));
    } catch (e) {
        console.error("Erro ao calcular: ", e.message);
    }
    
    rl.close();
}

// Descomente a linha abaixo caso queira iniciar o programa selecionando o veículo via terminal ao rodar 'node CalcularMediaGastos.js'
selecionarVeiculo();

module.exports = { validarRegistro, calcularMediaGastos, selecionarVeiculo, carregarVeiculos };
