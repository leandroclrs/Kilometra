/**
 * Módulo Refatorado de Cálculo de Consumo e Gastos Automotivos.
 * Inclui validação defensiva, ordenação cronológica e suporte a abastecimentos parciais.
 */

/**
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
 * 
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

    // Ordenação primária por data e secundária por odometria
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