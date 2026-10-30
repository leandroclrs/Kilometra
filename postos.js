/* ============================= */
/* POSTOS - Leaflet + OpenStreetMap */
/* Geocodificação: Nominatim | Postos: Overpass API */
/* ============================= */

(function () {

    const RAIO_POSTOS_METROS = 5000;
    const RAIO_POSTOS_KM = RAIO_POSTOS_METROS / 1000;
    const MAX_POSTOS = 20;

    const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

    const OVERPASS_URLS = [
        "https://overpass-api.de/api/interpreter",
        "https://overpass.kumi.systems/api/interpreter",
        "https://overpass.private.coffee/api/interpreter"
    ];

    let mapaPostos = null;
    let camadaPostos = null;

    const $ = (id) => document.getElementById(id);

    function atualizarStatus(mensagem) {
        const status = $("status-postos");
        if (status) status.textContent = mensagem;
    }

    function escaparHTML(texto) {
        return String(texto).replace(/[&<>"']/g, c => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
        }[c]));
    }

    /* ----------------------------- */
    /* Tela */
    /* ----------------------------- */

    function mostrarPostos(event) {

        if (event) {
            event.preventDefault();
        }

        if (typeof L === "undefined") {
            $("conteudo").innerHTML = `
                <h1>Postos de combustível</h1>
                <div class="panel">
                    <p>Não foi possível carregar o mapa (biblioteca Leaflet indisponível). Verifique sua conexão.</p>
                </div>`;
            return;
        }

        // O conteúdo é recriado a cada troca de tela: descarta o mapa anterior.
        if (mapaPostos) {
            mapaPostos.remove();
            mapaPostos = null;
            camadaPostos = null;
        }

        $("conteudo").innerHTML = `

            <div class="pagina-cabecalho">
                <div>
                    <h1>Postos de combustível</h1>
                    <p>Encontre postos próximos usando dados abertos do OpenStreetMap.</p>
                </div>
                <button type="button" class="botao-principal" id="btn-minha-localizacao">
                    Usar minha localização
                </button>
            </div>

            <div class="formulario">
                <div class="campo">
                    <label for="local-pesquisa">Cidade ou endereço</label>
                    <input type="text" id="local-pesquisa"
                           placeholder="Digite uma cidade ou endereço">
                </div>
                <button type="button" class="botao-principal" id="buscar-postos">
                    Buscar postos
                </button>
            </div>

            <section class="dashboard">
                <div class="panel">
                    <div id="mapa-postos" style="height: 420px;"></div>
                    <p id="status-postos" role="status" aria-live="polite">
                        Digite um endereço ou use sua localização para buscar postos.
                    </p>
                    <p>
                        Os resultados dependem dos dados disponíveis no OpenStreetMap.
                        Este protótipo usa serviços públicos com limites de utilização.
                    </p>
                </div>
            </section>

            <section class="lista-veiculos" id="lista-postos"></section>
        `;

        criarMapa();
        configurarEventos();
    }

    /* ----------------------------- */
    /* Mapa */
    /* ----------------------------- */

    function criarMapa() {

        mapaPostos = L.map("mapa-postos").setView([-14.235, -51.9253], 4);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(mapaPostos);

        camadaPostos = L.layerGroup().addTo(mapaPostos);
    }

    /* ----------------------------- */
    /* Serviços */
    /* ----------------------------- */

    async function geocodificar(endereco) {

        const url = new URL(NOMINATIM_URL);

        url.search = new URLSearchParams({
            q: endereco, format: "jsonv2", limit: "1", countrycodes: "br"
        }).toString();

        const resposta = await fetch(url, { headers: { "Accept-Language": "pt-BR" } });

        if (!resposta.ok) throw new Error("Falha ao pesquisar o endereço.");

        const resultados = await resposta.json();

        if (!resultados.length) {
            throw new Error("Endereço não encontrado. Tente informar cidade e estado.");
        }

        return {
            lat: Number(resultados[0].lat),
            lon: Number(resultados[0].lon),
            label: resultados[0].display_name
        };
    }

    async function buscarOverpass(lat, lon) {

        const area = `(around:${RAIO_POSTOS_METROS},${lat},${lon})`;

        const consulta = `[out:json][timeout:25];(node["amenity"="fuel"]${area};way["amenity"="fuel"]${area};relation["amenity"="fuel"]${area};);out center tags;`;

        let ultimoErro;

        for (const endpoint of OVERPASS_URLS) {
            try {
                const resposta = await fetch(endpoint, {
                    method: "POST",
                    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
                    body: "data=" + encodeURIComponent(consulta)
                });

                if (!resposta.ok) {
                    throw new Error("O serviço de busca está ocupado (HTTP " + resposta.status + ").");
                }

                const dados = await resposta.json();

                return (dados.elements || [])
                    .map(item => ({
                        ...item,
                        latPosto: item.lat ?? item.center?.lat,
                        lonPosto: item.lon ?? item.center?.lon
                    }))
                    .filter(item => Number.isFinite(item.latPosto) && Number.isFinite(item.lonPosto))
                    .slice(0, MAX_POSTOS);

            } catch (erro) {
                ultimoErro = erro;
            }
        }

        throw ultimoErro || new Error("Não foi possível consultar os postos agora.");
    }

    /* ----------------------------- */
    /* Resultados */
    /* ----------------------------- */

    function nomePosto(posto) {
        return posto.tags?.name || posto.tags?.brand || posto.tags?.operator || "Posto de combustível";
    }

    function exibirPostos(postos, centro) {

        camadaPostos.clearLayers();
        $("lista-postos").replaceChildren();

        postos.forEach(posto => {

            const nome = nomePosto(posto);

            const endereco = [
                posto.tags?.["addr:street"],
                posto.tags?.["addr:housenumber"],
                posto.tags?.["addr:city"]
            ].filter(Boolean).join(", ") || "Endereço não informado nos dados do mapa";

            const marcador = L.marker([posto.latPosto, posto.lonPosto])
                .bindPopup(`<strong>${escaparHTML(nome)}</strong><br>${escaparHTML(endereco)}`)
                .addTo(camadaPostos);

            const item = document.createElement("div");
            const info = document.createElement("div");
            const titulo = document.createElement("h2");
            const p = document.createElement("p");
            const btn = document.createElement("button");

            item.className = "veiculo";
            info.className = "veiculo-info";
            titulo.textContent = nome;
            p.textContent = endereco;
            btn.type = "button";
            btn.className = "botao-secundario";
            btn.textContent = "Ver no mapa";

            btn.addEventListener("click", () => {
                mapaPostos.setView([posto.latPosto, posto.lonPosto], 16);
                marcador.openPopup();
                $("mapa-postos").scrollIntoView({ behavior: "smooth", block: "center" });
            });

            info.append(titulo, p);
            item.append(info, btn);
            $("lista-postos").append(item);
        });

        if (postos.length) {
            const limites = L.latLngBounds(postos.map(p => [p.latPosto, p.lonPosto]));
            limites.extend([centro.lat, centro.lon]);
            mapaPostos.fitBounds(limites.pad(0.15), { maxZoom: 14 });
            atualizarStatus(`${postos.length} posto(s) encontrado(s) em um raio de até ${RAIO_POSTOS_KM} km.`);
        } else {
            mapaPostos.setView([centro.lat, centro.lon], 14);
            atualizarStatus(`Nenhum posto mapeado encontrado em um raio de ${RAIO_POSTOS_KM} km. Tente outro endereço.`);
        }
    }

    async function pesquisarNaLocalizacao(local) {

        const mapaAtual = mapaPostos;

        mapaPostos.setView([local.lat, local.lon], 13);
        atualizarStatus("Buscando postos próximos...");
        $("buscar-postos").disabled = true;
        $("btn-minha-localizacao").disabled = true;

        try {
            const postos = await buscarOverpass(local.lat, local.lon);

            // Se o usuário trocou de tela enquanto buscava, ignora o resultado.
            if (mapaAtual !== mapaPostos) return;

            exibirPostos(postos, local);

        } catch (erro) {
            console.error(erro);
            atualizarStatus((erro.message || "Erro ao pesquisar postos") +
                " Aguarde um pouco e tente novamente.");
        } finally {
            if ($("buscar-postos")) $("buscar-postos").disabled = false;
            if ($("btn-minha-localizacao")) $("btn-minha-localizacao").disabled = false;
        }
    }

    /* ----------------------------- */
    /* Eventos */
    /* ----------------------------- */

    function configurarEventos() {

        $("buscar-postos").addEventListener("click", async () => {

            const entrada = $("local-pesquisa").value.trim();

            if (!entrada) {
                atualizarStatus("Digite uma cidade ou endereço para pesquisar.");
                return;
            }

            atualizarStatus("Localizando endereço...");
            $("buscar-postos").disabled = true;

            try {
                const local = await geocodificar(entrada);
                if (!$("buscar-postos")) return;
                await pesquisarNaLocalizacao(local);
            } catch (erro) {
                atualizarStatus(erro.message || "Não foi possível localizar o endereço.");
            } finally {
                if ($("buscar-postos")) $("buscar-postos").disabled = false;
            }
        });

        $("local-pesquisa").addEventListener("keydown", event => {
            if (event.key === "Enter") $("buscar-postos").click();
        });

        $("btn-minha-localizacao").addEventListener("click", () => {

            if (!navigator.geolocation) {
                atualizarStatus("Seu navegador não oferece suporte à localização. Pesquise um endereço.");
                return;
            }

            atualizarStatus("Solicitando sua localização...");

            navigator.geolocation.getCurrentPosition(
                position => pesquisarNaLocalizacao({
                    lat: position.coords.latitude,
                    lon: position.coords.longitude
                }),
                erro => {
                    const mensagens = {
                        1: "Permissão de localização negada. Autorize o acesso ou pesquise um endereço.",
                        2: "Não foi possível identificar sua localização. Pesquise um endereço.",
                        3: "A localização demorou muito. Tente novamente."
                    };
                    atualizarStatus(mensagens[erro.code] || "Não foi possível obter sua localização.");
                },
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
            );
        });
    }

    // Disponível para o onclick do menu no index.html
    window.mostrarPostos = mostrarPostos;

})();
