const carros = [

    {
        id: 1,
        marca: "Fiat",
        modelo: "Uno Mille 1.0",
        ano: 2010,
        consumoMedioKmPorLitro: 12.0
    },

    {
        id: 2,
        marca: "Volkswagen",
        modelo: "Gol G4 1.0",
        ano: 2013,
        consumoMedioKmPorLitro: 11.5
    },

    {
        id: 3,
        marca: "Chevrolet",
        modelo: "Onix 1.0",
        ano: 2019,
        consumoMedioKmPorLitro: 13.9
    },

];

function mostrarInicio(event) {

    if (event) {
        event.preventDefault();
    }

    const conteudo = document.getElementById("conteudo");

    conteudo.innerHTML = `

        <h1>Visão geral</h1>

        <section class="cards">

            <div class="card">

                <p class="card-title">
                    Veículo
                </p>

                <p class="card-value">
                    XXXXXXXXX
                </p>

            </div>


            <div class="card">

                <p class="card-title">
                    Consumo médio
                </p>

                <p class="card-value">
                    12,5 km/L
                </p>

            </div>


            <div class="card">

                <p class="card-title">
                    Gastos
                </p>

                <p class="card-value">
                    R$ 850,00
                </p>

            </div>


            <div class="card">

                <p class="card-title">
                    Autonomia
                </p>

                <p class="card-value">
                    200 km
                </p>

            </div>

        </section>


        <section class="dashboard">

            <div class="panel">

                <h2>
                    Próximas Manutenções
                </h2>

                <p>
                    Conteúdo das manutenções
                </p>

            </div>


            <div class="panel">

                <h2>
                    Últimos Abastecimentos
                </h2>

                ${resumoUltimosAbastecimentos()}

            </div>

        </section>

    `;
}


/* ============================= */
/* VEÍCULOS */
/* ============================= */

function mostrarVeiculos(event) {

    if (event) {
        event.preventDefault();
    }

    const conteudo = document.getElementById("conteudo");

    conteudo.innerHTML = `

        <div class="pagina-cabecalho">

            <div>

                <h1>
                    Meus veículos
                </h1>

                <p>
                    Veículos cadastrados no Kilometra
                </p>

            </div>


            <button
                class="botao-principal"
                onclick="mostrarCadastro()"
            >
                + Cadastrar veículo
            </button>

        </div>


        <section class="lista-veiculos">

            ${carros.map(carro => `

                <div class="veiculo">

                    <div class="veiculo-info">

                        <h2>
                            ${carro.marca} ${carro.modelo}
                        </h2>

                        <p>
                            Ano: ${carro.ano}
                        </p>

                    </div>


                    <div class="veiculo-consumo">

                        <span>
                            Consumo médio
                        </span>

                        <strong>
                            ${carro.consumoMedioKmPorLitro} km/L
                        </strong>

                    </div>

                </div>

            `).join("")}

        </section>

    `;
}


/* ============================= */
/* CADASTRO */
/* ============================= */

function mostrarCadastro() {

    const conteudo = document.getElementById("conteudo");

    conteudo.innerHTML = `

        <div class="pagina-cabecalho">

            <div>

                <h1>
                    Cadastrar veículo
                </h1>

                <p>
                    Adicione um novo veículo
                </p>

            </div>


            <button
                class="botao-secundario"
                onclick="mostrarVeiculos()"
            >
                Voltar
            </button>

        </div>


        <section class="formulario">

            <div class="campo">

                <label for="carro">
                    Veículo
                </label>

                <select id="carro">

                    <option value="">
                        Selecione um veículo
                    </option>

                    ${carros.map(carro => `

                        <option value="${carro.id}">
                            ${carro.marca} - ${carro.modelo}
                        </option>

                    `).join("")}

                </select>

            </div>


            <div class="campo">

                <label for="ano">
                    Ano
                </label>

                <input
                    type="number"
                    id="ano"
                    placeholder="Ex.: 2020"
                >

            </div>


            <button
                class="botao-principal"
                onclick="cadastrarVeiculo()"
            >
                Cadastrar veículo
            </button>

        </section>

    `;
}


/* ============================= */
/* CADASTRAR VEÍCULO */
/* ============================= */

function cadastrarVeiculo() {

    const carroSelecionado =
        document.getElementById("carro").value;

    const ano =
        document.getElementById("ano").value;


    if (!carroSelecionado || !ano) {

        alert("Preencha todos os campos.");

        return;
    }


    const carro = carros.find(
        carro => carro.id == carroSelecionado
    );


    console.log("Veículo cadastrado:", {

        marca: carro.marca,

        modelo: carro.modelo,

        ano: ano,

        consumoMedioKmPorLitro:
            carro.consumoMedioKmPorLitro

    });


    alert("Veículo cadastrado com sucesso!");


    mostrarVeiculos();

}