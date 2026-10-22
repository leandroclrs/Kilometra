/* ============================= */
/* ABASTECIMENTOS */
/* Depende do array "carros" definido em cadastroDeVeículos.js */
/* ============================= */

// As datas são guardadas no formato AAAA-MM-DD (facilita ordenar)
const registrosAbastecimento = {

    1: [
        { data: "2026-10-05", km: 142000, litros: 35.0, precoLitro: 5.89, tipo: "Gasolina Comum" },
        { data: "2026-10-15", km: 142420, litros: 33.5, precoLitro: 5.92, tipo: "Gasolina Comum" },
        { data: "2026-10-20", km: 142830, litros: 34.0, precoLitro: 5.85, tipo: "Etanol" }
    ],

    2: [
        { data: "2026-10-02", km: 118500, litros: 40.0, precoLitro: 5.85, tipo: "Gasolina Comum" },
        { data: "2026-10-12", km: 118950, litros: 38.0, precoLitro: 5.89, tipo: "Gasolina Comum" },
        { data: "2026-10-22", km: 119390, litros: 39.5, precoLitro: 5.95, tipo: "Gasolina Aditivada" }
    ],

    3: [
        { data: "2026-10-08", km: 54100, litros: 38.0, precoLitro: 5.99, tipo: "Gasolina Aditivada" },
        { data: "2026-10-17", km: 54625, litros: 37.0, precoLitro: 5.89, tipo: "Gasolina Comum" },
        { data: "2026-10-21", km: 55140, litros: 37.5, precoLitro: 5.92, tipo: "Gasolina Comum" }
    ]

};

const tiposCombustivel = [
    "Gasolina Comum",
    "Gasolina Aditivada",
    "Etanol",
    "Diesel"
];


/* ----------------------------- */
/* Funções auxiliares            */
/* ----------------------------- */

function formatarMoeda(valor) {

    return valor.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}


function formatarLitros(valor) {

    return valor.toFixed(1).replace(".", ",") + " L";
}


// "2026-10-05" -> "05/10/2026"
function formatarData(dataIso) {

    const [ano, mes, dia] = dataIso.split("-");

    return `${dia}/${mes}/${ano}`;
}


// Data de hoje no formato AAAA-MM-DD (fuso local)
function dataDeHoje() {

    const hoje = new Date();

    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");

    return `${hoje.getFullYear()}-${mes}-${dia}`;
}


// Lista única com todos os abastecimentos, do mais recente ao mais antigo
function todosAbastecimentos() {

    const lista = [];

    carros.forEach(carro => {

        (registrosAbastecimento[carro.id] || []).forEach(reg => {

            lista.push({ ...reg, carro: carro });

        });

    });

    return lista.sort((a, b) => {

        if (a.data !== b.data) {
            return b.data.localeCompare(a.data);
        }

        return b.km - a.km;
    });
}


/* ----------------------------- */
/* Resumo para a tela de Início  */
/* ----------------------------- */

function resumoUltimosAbastecimentos() {

    const ultimos = todosAbastecimentos().slice(0, 5);

    if (ultimos.length === 0) {

        return `
            <p>
                Nenhum abastecimento registrado ainda.
            </p>
        `;
    }

    return `

        <ul class="resumo-abastecimentos">

            ${ultimos.map(reg => `

                <li>

                    <div>

                        <strong>
                            ${reg.carro.marca} ${reg.carro.modelo}
                        </strong>

                        <span>
                            ${formatarData(reg.data)} · ${reg.tipo} · ${formatarLitros(reg.litros)}
                        </span>

                    </div>

                    <div class="resumo-valor">
                        ${formatarMoeda(reg.litros * reg.precoLitro)}
                    </div>

                </li>

            `).join("")}

        </ul>

        <a
            href="#"
            class="link-ver-todos"
            onclick="mostrarAbastecimentos(event)"
        >
            Ver todos os abastecimentos →
        </a>

    `;
}


/* ----------------------------- */
/* Tela de abastecimentos        */
/* ----------------------------- */

function mostrarAbastecimentos(event) {

    if (event) {
        event.preventDefault();
    }

    const conteudo = document.getElementById("conteudo");

    const veiculos = carros.filter(
        carro => (registrosAbastecimento[carro.id] || []).length > 0
    );

    let gastoGeral = 0;
    let litrosGeral = 0;
    let quantidadeGeral = 0;

    veiculos.forEach(carro => {

        registrosAbastecimento[carro.id].forEach(reg => {

            gastoGeral += reg.litros * reg.precoLitro;
            litrosGeral += reg.litros;
            quantidadeGeral++;

        });

    });


    conteudo.innerHTML = `

        <div class="pagina-cabecalho">

            <div>

                <h1>
                    Abastecimentos
                </h1>

                <p>
                    Histórico de abastecimento por veículo
                </p>

            </div>


            <button
                class="botao-principal"
                onclick="mostrarNovoAbastecimento()"
            >
                + Novo abastecimento
            </button>

        </div>


        <section class="cards">

            <div class="card">
                <p class="card-title">Veículos</p>
                <p class="card-value">${veiculos.length}</p>
            </div>

            <div class="card">
                <p class="card-title">Abastecimentos</p>
                <p class="card-value">${quantidadeGeral}</p>
            </div>

            <div class="card">
                <p class="card-title">Litros totais</p>
                <p class="card-value">${formatarLitros(litrosGeral)}</p>
            </div>

            <div class="card">
                <p class="card-title">Gasto total</p>
                <p class="card-value">${formatarMoeda(gastoGeral)}</p>
            </div>

        </section>


        <section class="lista-abastecimentos">

            ${
                veiculos.length
                    ? veiculos.map(carro => criarBlocoAbastecimento(carro)).join("")
                    : "<p>Nenhum abastecimento registrado ainda.</p>"
            }

        </section>

    `;
}


function criarBlocoAbastecimento(carro) {

    // Do mais recente ao mais antigo
    const registros = [...registrosAbastecimento[carro.id]].sort(
        (a, b) => b.data.localeCompare(a.data)
    );

    const totalLitros = registros.reduce(
        (soma, reg) => soma + reg.litros, 0
    );

    const totalGasto = registros.reduce(
        (soma, reg) => soma + reg.litros * reg.precoLitro, 0
    );

    const linhas = registros.map(reg => `

        <tr>

            <td>${formatarData(reg.data)}</td>

            <td>${reg.km.toLocaleString("pt-BR")} km</td>

            <td>
                <span class="tag-combustivel">
                    ${reg.tipo}
                </span>
            </td>

            <td class="direita">${formatarLitros(reg.litros)}</td>

            <td class="direita">${formatarMoeda(reg.precoLitro)}</td>

            <td class="direita valor-total">
                ${formatarMoeda(reg.litros * reg.precoLitro)}
            </td>

        </tr>

    `).join("");


    return `

        <div class="abastecimento-veiculo">

            <div class="abastecimento-cabecalho">

                <div>

                    <h2>
                        ${carro.marca} ${carro.modelo}
                        <span>(${carro.ano})</span>
                    </h2>

                    <p>
                        Consumo médio: ${carro.consumoMedioKmPorLitro} km/L
                    </p>

                </div>


                <div class="abastecimento-totais">

                    <div>
                        <span>Litros totais</span>
                        <strong>${formatarLitros(totalLitros)}</strong>
                    </div>

                    <div>
                        <span>Gasto total</span>
                        <strong>${formatarMoeda(totalGasto)}</strong>
                    </div>

                </div>

            </div>


            <div class="tabela-container">

                <table class="tabela-abastecimentos">

                    <thead>

                        <tr>
                            <th>Data</th>
                            <th>Odômetro</th>
                            <th>Combustível</th>
                            <th class="direita">Volume</th>
                            <th class="direita">Preço/L</th>
                            <th class="direita">Total</th>
                        </tr>

                    </thead>

                    <tbody>
                        ${linhas}
                    </tbody>

                </table>

            </div>

        </div>

    `;
}


/* ----------------------------- */
/* Novo abastecimento (formulário) */
/* ----------------------------- */

function mostrarNovoAbastecimento() {

    const conteudo = document.getElementById("conteudo");

    conteudo.innerHTML = `

        <div class="pagina-cabecalho">

            <div>

                <h1>
                    Novo abastecimento
                </h1>

                <p>
                    Registre um abastecimento de um veículo
                </p>

            </div>


            <button
                class="botao-secundario"
                onclick="mostrarAbastecimentos()"
            >
                Voltar
            </button>

        </div>


        <section class="formulario">

            <div class="campo">

                <label for="abast-carro">Veículo</label>

                <select id="abast-carro">

                    <option value="">Selecione um veículo</option>

                    ${carros.map(carro => `
                        <option value="${carro.id}">
                            ${carro.marca} - ${carro.modelo} (${carro.ano})
                        </option>
                    `).join("")}

                </select>

            </div>


            <div class="campo-linha">

                <div class="campo">

                    <label for="abast-data">Data</label>

                    <input
                        type="date"
                        id="abast-data"
                        value="${dataDeHoje()}"
                        max="${dataDeHoje()}"
                    >

                </div>


                <div class="campo">

                    <label for="abast-km">Odômetro (km)</label>

                    <input
                        type="number"
                        id="abast-km"
                        min="0"
                        placeholder="Ex.: 54800"
                    >

                </div>

            </div>


            <div class="campo">

                <label for="abast-tipo">Combustível</label>

                <select id="abast-tipo">

                    ${tiposCombustivel.map(tipo => `
                        <option value="${tipo}">${tipo}</option>
                    `).join("")}

                </select>

            </div>


            <div class="campo-linha">

                <div class="campo">

                    <label for="abast-litros">Litros</label>

                    <input
                        type="number"
                        id="abast-litros"
                        min="0"
                        step="0.01"
                        placeholder="Ex.: 35,5"
                        oninput="atualizarTotalAbastecimento()"
                    >

                </div>


                <div class="campo">

                    <label for="abast-preco">Preço por litro (R$)</label>

                    <input
                        type="number"
                        id="abast-preco"
                        min="0"
                        step="0.01"
                        placeholder="Ex.: 5,89"
                        oninput="atualizarTotalAbastecimento()"
                    >

                </div>

            </div>


            <div class="total-previsto">

                <span>Total do abastecimento</span>

                <strong id="abast-total">R$ 0,00</strong>

            </div>


            <button
                class="botao-principal"
                onclick="salvarAbastecimento()"
            >
                Salvar abastecimento
            </button>

        </section>

    `;
}


function atualizarTotalAbastecimento() {

    const litros = parseFloat(document.getElementById("abast-litros").value) || 0;
    const preco = parseFloat(document.getElementById("abast-preco").value) || 0;

    document.getElementById("abast-total").textContent =
        formatarMoeda(litros * preco);
}


function salvarAbastecimento() {

    const carroId = document.getElementById("abast-carro").value;
    const data = document.getElementById("abast-data").value;
    const km = parseInt(document.getElementById("abast-km").value, 10);
    const tipo = document.getElementById("abast-tipo").value;
    const litros = parseFloat(document.getElementById("abast-litros").value);
    const precoLitro = parseFloat(document.getElementById("abast-preco").value);


    if (!carroId || !data || !tipo) {

        alert("Preencha todos os campos.");

        return;
    }


    if (!(km > 0) || !(litros > 0) || !(precoLitro > 0)) {

        alert("Odômetro, litros e preço por litro precisam ser maiores que zero.");

        return;
    }


    if (data > dataDeHoje()) {

        alert("A data do abastecimento não pode estar no futuro.");

        return;
    }


    if (!registrosAbastecimento[carroId]) {
        registrosAbastecimento[carroId] = [];
    }


    // O odômetro não pode ser menor que o de um abastecimento anterior
    const kmAnterior = Math.max(
        0,
        ...registrosAbastecimento[carroId]
            .filter(reg => reg.data <= data)
            .map(reg => reg.km)
    );

    if (km < kmAnterior) {

        alert(
            "O odômetro (" + km.toLocaleString("pt-BR") + " km) é menor que o de um " +
            "abastecimento anterior (" + kmAnterior.toLocaleString("pt-BR") + " km)."
        );

        return;
    }


    registrosAbastecimento[carroId].push({
        data: data,
        km: km,
        litros: litros,
        precoLitro: precoLitro,
        tipo: tipo
    });


    alert("Abastecimento registrado com sucesso!");

    mostrarAbastecimentos();
}


/* ----------------------------- */
/* Tela de Início ao abrir a página */
/* ----------------------------- */

document.addEventListener("DOMContentLoaded", function () {

    mostrarInicio();

});
