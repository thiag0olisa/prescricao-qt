document.addEventListener('DOMContentLoaded', function() {

    // --- VARIÁVEIS GLOBAIS ---
    let baseDeProtocolos = [];
    let nomesProtocolosUnicos = [];
    let baseDeCids = [];

    // --- Links para as bases de dados ---
    const URL_PROTOCOLOS = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTLn5slgkiJmOpgt9d5l72iqTZzHxJM5U1u-34Jz66scD5kdaqX3eXNyXQLwfKNPtRvon_uf94mFS0G/pub?output=csv';
    const URL_CIDS = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS3Stx61SZrBgOazB4agFfkm5O3sx5tOMpTS2FeA3mif8lgtDZoWCaalUzfKftrWvXCrLBP0Y-1dVrO/pub?output=csv';

    // --- FUNÇÃO DE INICIALIZAÇÃO ---
    function initializeContent() {
        const refs = {
            nascimentoInput: document.getElementById('nascimento'),
            idadeSpan: document.getElementById('idade-calculada'),
            pesoInput: document.getElementById('peso'),
            alturaInput: document.getElementById('altura'),
            ascSpan: document.getElementById('resultado-asc'),
            protocoloSearchInput: document.getElementById('protocolo-search'),
            suggestionsBox: document.getElementById('suggestions-box'),
            cidInput: document.getElementById('cid'),
            diagnosticoInput: document.getElementById('diagnostico'),
            diagnosticoSuggestionsBox: document.getElementById('diagnostico-suggestions-box'),
            cidSuggestionsBox: document.getElementById('cid-suggestions-box'),
            printButton: document.getElementById('print-button'),
            inicioQtInput: document.getElementById('inicio-qt'),
        };

        // Adiciona Event Listeners
        refs.nascimentoInput.addEventListener('change', () => calcularIdade(refs.nascimentoInput, refs.idadeSpan));
        refs.pesoInput.addEventListener('input', () => calcularASC(refs.pesoInput, refs.alturaInput, refs.ascSpan));
        refs.alturaInput.addEventListener('input', () => calcularASC(refs.pesoInput, refs.alturaInput, refs.ascSpan));
        refs.protocoloSearchInput.addEventListener('input', () => mostrarSugestoesProtocolos(refs.protocoloSearchInput, refs.suggestionsBox));
        refs.diagnosticoInput.addEventListener('input', () => mostrarSugestoesCid(refs.diagnosticoInput, refs.diagnosticoSuggestionsBox));
        refs.cidInput.addEventListener('input', () => mostrarSugestoesCid(refs.cidInput, refs.cidSuggestionsBox));
        
        // O event listener do botão de impressão precisa de estar no HTML para funcionar.
        // Se o botão não existir no seu HTML, esta linha pode ser removida.
        if (refs.printButton) {
            refs.printButton.addEventListener('click', () => window.print());
        }

        // Carrega as duas bases de dados
        Promise.all([
            carregarDados(URL_PROTOCOLOS, ","),
            carregarDados(URL_CIDS, ",")
        ])
        .then(([dadosProtocolos, dadosCids]) => {
            baseDeProtocolos = dadosProtocolos;
            baseDeCids = dadosCids;
            nomesProtocolosUnicos = [...new Set(baseDeProtocolos.map(item => item.protocolo ? item.protocolo.trim() : ''))].filter(Boolean).sort();
            
            refs.protocoloSearchInput.disabled = false;
            refs.protocoloSearchInput.placeholder = "Pesquise por nome...";
            console.log("Bases de dados carregadas com sucesso!");
        })
        .catch(error => {
            console.error("Falha no carregamento de dados:", error);
            alert(`Não foi possível carregar as bases de dados. Erro: ${error.message}`);
        });
    }

    // --- DEFINIÇÃO DE TODAS AS FUNÇÕES ---

    function carregarDados(url, delimiter) {
        return new Promise((resolve, reject) => {
            if (!url || url.includes('COLE_AQUI')) {
                return reject(new Error(`URL não configurada.`));
            }
            Papa.parse(url, {
                download: true, header: true, skipEmptyLines: true, delimiter: delimiter,
                transformHeader: header => header.trim().toLowerCase().replace(/\s+/g, '_'),
                complete: results => resolve(results.data),
                error: error => reject(new Error(`Falha ao analisar o ficheiro de ${url}: ${error.message}`))
            });
        });
    }

    function mostrarSugestoesCid(inputElement, suggestionsBox) {
        const textoPesquisado = inputElement.value.toLowerCase();
        [document.getElementById('diagnostico-suggestions-box'), document.getElementById('cid-suggestions-box')].forEach(box => box.innerHTML = '');
        if (textoPesquisado.length < 2) return;
        const sugestoes = baseDeCids.filter(item => 
            (item.cid && item.cid.toLowerCase().includes(textoPesquisado)) ||
            (item.significado && item.significado.toLowerCase().includes(textoPesquisado))
        );
        sugestoes.slice(0, 10).forEach(sugestao => {
            const div = document.createElement('div');
            div.innerHTML = `<strong>${sugestao.cid}</strong> - ${sugestao.significado}`;
            div.classList.add('suggestion-item');
            div.onclick = () => {
                document.getElementById('diagnostico').value = sugestao.significado;
                document.getElementById('cid').value = sugestao.cid;
                suggestionsBox.innerHTML = '';
            };
            suggestionsBox.appendChild(div);
        });
    }

    function calcularIdade(nascimentoInput, idadeSpan) {
        if (!nascimentoInput.value) { idadeSpan.textContent = "..."; return; }
        const hoje = new Date();
        const nascimento = new Date(nascimentoInput.value);
        let idade = hoje.getFullYear() - nascimento.getFullYear();
        const m = hoje.getMonth() - nascimento.getMonth();
        if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) { idade--; }
        idadeSpan.textContent = `${idade} anos`;
    }

    function calcularASC(pesoInput, alturaInput, ascSpan) {
        const peso = parseFloat(pesoInput.value);
        const altura = parseFloat(alturaInput.value);
        if (!isNaN(peso) && !isNaN(altura) && peso > 0 && altura > 0) {
            const asc = Math.sqrt((peso * altura) / 3600);
            ascSpan.textContent = asc.toFixed(2) + ' m²';
            return asc;
        }
        ascSpan.textContent = '... m²';
        return NaN;
    }

    function mostrarSugestoesProtocolos(protocoloSearchInput, suggestionsBox) {
        const textoPesquisado = protocoloSearchInput.value.toLowerCase();
        document.getElementById('resultado-protocolo').classList.add('hidden');
        suggestionsBox.innerHTML = '';
        if (textoPesquisado.length === 0) return;
        const sugestoes = nomesProtocolosUnicos.filter(prot => prot.toLowerCase().includes(textoPesquisado));
        sugestoes.slice(0, 10).forEach(sugestao => {
            const div = document.createElement('div');
            div.textContent = sugestao;
            div.classList.add('suggestion-item');
            div.onclick = () => {
                protocoloSearchInput.value = sugestao;
                suggestionsBox.innerHTML = '';
                exibirProtocolo(sugestao);
            };
            suggestionsBox.appendChild(div);
        });
    }
    
     function exibirProtocolo(protocoloSelecionado) {
        if (!protocoloSelecionado) return;

        const resultadoDiv = document.getElementById('resultado-protocolo');
        const preQtTabelaDiv = document.getElementById('pre-qt-tabela');
        const qtTabelaDiv = document.getElementById('qt-tabela');
        const inicioQtInput = document.getElementById('inicio-qt');
        const dataPrescricaoSpan = document.getElementById('data-prescricao');
        const prescricaoPacienteDiv = document.getElementById('prescricao-paciente');
        const diagnosticoIndicado = document.getElementById('diagnostico-indicado');
        const potencialEmetogenicoTexto = document.getElementById('potencial-emetogenico-texto');
        
        if (!inicioQtInput.value) {
            alert("Por favor, selecione uma data para o 'Início do QT' antes de continuar.");
            document.getElementById('protocolo-search').value = ''; 
            return;
        }

        const asc = calcularASC(document.getElementById('peso'), document.getElementById('altura'), document.getElementById('resultado-asc'));
        if (isNaN(asc)) {
            alert("Por favor, preencha o peso e a altura com valores válidos.");
            document.getElementById('protocolo-search').value = '';
            return;
        }
        
        const itensProtocolo = baseDeProtocolos.filter(item => item.protocolo.trim().toUpperCase() === protocoloSelecionado.toUpperCase());
        if (itensProtocolo.length === 0) return;

        const preQt = itensProtocolo.filter(item => item.tipo && item.tipo.trim().toUpperCase() === 'PRE-QT');
        const qt = itensProtocolo.filter(item => item.tipo && item.tipo.trim().toUpperCase() === 'QT');
        const infoGeral = itensProtocolo[0];
        
        dataPrescricaoSpan.textContent = new Date().toLocaleDateString('pt-BR');
        prescricaoPacienteDiv.innerHTML = `
            <p><strong>Paciente:</strong> ${document.getElementById('nome').value || 'Não informado'}</p>
            <p><strong>Prontuário:</strong> ${document.getElementById('prontuario').value || 'Não informado'}</p>
            <p><strong>Diagnóstico:</strong> ${document.getElementById('diagnostico').value || 'Não informado'}</p>
        `;
        
        diagnosticoIndicado.textContent = infoGeral.diagnostico_associado || 'Não especificado na planilha';
        potencialEmetogenicoTexto.textContent = infoGeral.potencial_emetogenico || 'Não especificado na planilha';

        preQtTabelaDiv.innerHTML = montarTabela(preQt, asc, false, inicioQtInput.value);
        qtTabelaDiv.innerHTML = montarTabela(qt, asc, true, inicioQtInput.value);
        
        resultadoDiv.classList.remove('hidden');
    }

    function calcularDataDoCiclo(dataInicioStr, diaCicloStr) {
        if (!dataInicioStr || !diaCicloStr) return '...';
        try {
            const numeroDoDia = parseInt(diaCicloStr.replace(/\D/g, ''), 10);
            if (isNaN(numeroDoDia)) return '...';
            const [ano, mes, dia] = dataInicioStr.split('-');
            const dataInicio = new Date(Date.UTC(ano, mes - 1, dia));
            dataInicio.setUTCDate(dataInicio.getUTCDate() + numeroDoDia - 1);
            const diaF = String(dataInicio.getUTCDate()).padStart(2, '0');
            const mesF = String(dataInicio.getUTCMonth() + 1).padStart(2, '0');
            const anoF = dataInicio.getUTCFullYear();
            return `${diaF}/${mesF}/${anoF}`;
        } catch (e) {
            return 'Erro';
        }
    }

    function parseDoseUnidade(doseString) {
        if (typeof doseString !== 'string' || !doseString) return { valor: NaN, unidade: '' };
        const match = doseString.trim().match(/^(\d+[\.,]?\d*)\s*(.*)/);
        if (match) {
            const valorNumerico = parseFloat(match[1].replace(',', '.'));
            const unidadeTexto = match[2].trim();
            return { valor: valorNumerico, unidade: unidadeTexto };
        }
        return { valor: NaN, unidade: doseString };
    }

    // SUBSTITUA a sua função montarTabela antiga por esta versão corrigida

function montarTabela(dados, asc, calcularDose, dataInicio) {
    if (dados.length === 0) return "<p>Nenhum item para este esquema.</p>";
    
    let tabelaHtml = `<table>
    <thead>
    <tr>
    <th class="col-item">Item</th>
                <th class="col-data">Data</th>
                <th class="col-dias">Dias</th>
                <th class="col-ciclo">Ciclo</th>
                <th class="col-medicamento">Medicamento</th>
                <th class="col-dose-calc">Dose Calculada</th>
                <th class="col-dose-ref">Dose Referência</th>
                <th class="col-via">Via</th>
                <th class="col-tempo">Tempo de Infusão</th>
                <th class="col-aprazamento">Aprazamento</th>
    </tr></thead><tbody>`;
    
    let itemCounter = 0;
    dados.forEach(item => {
        const diasStr = item.dias || '';
        let diasDeAplicacao = [];

        if (diasStr.includes(',')) {
            diasDeAplicacao = diasStr.split(',').map(d => d.trim());
        } else if (diasStr.toLowerCase().includes(' a ')) {
            const partes = diasStr.toLowerCase().split(' a ');
            const inicio = parseInt(partes[0].replace(/\D/g, ''), 10);
            const fim = parseInt(partes[1].replace(/\D/g, ''), 10);
            if (!isNaN(inicio) && !isNaN(fim)) {
                for (let i = inicio; i <= fim; i++) diasDeAplicacao.push(`D${i}`);
            }
        } else {
            if (diasStr) diasDeAplicacao.push(diasStr);
        }

        diasDeAplicacao.forEach(diaEspecifico => {
            itemCounter++;
            let doseFinal = "-";
            const doseInfo = parseDoseUnidade(item.dose);
            if (calcularDose && !isNaN(doseInfo.valor)) {
                if (doseInfo.unidade.toLowerCase().includes('mg/m2')) {
                    let doseCalculada = doseInfo.valor * asc;
                    doseFinal = `<strong>${doseCalculada.toFixed(2)} mg</strong>`;
                } else {
                    doseFinal = `<strong>${item.dose}</strong>`;
                }
            } else if (item.dose) {
                doseFinal = item.dose;
            }

            // --- AQUI ESTÁ A CORREÇÃO ---
            // A linha que antes dizia "AGUARDANDO..." agora chama a função de cálculo.
            const dataCalculada = calcularDataDoCiclo(dataInicio, diaEspecifico);
            const aprazamentoInput = `<input type="time" class="horario-aprazamento">`;
            
            tabelaHtml += `<tr>
               <td class="col-item">${itemCounter}</td>
                    <td class="col-data">${dataCalculada}</td>
                    <td class="col-dias">${diaEspecifico}</td>
                    <td class="col-ciclo">${item.ciclos || item.ciclo || '-'}</td>
                    <td class="col-medicamento">${item.medicamento || '-'}</td>
                    <td class="col-dose-calc">${doseFinal}</td>
                    <td class="col-dose-ref">${item.dose || ''}</td>
                    <td class="col-via">${item.via_adm || '-'}</td>
                    <td class="col-tempo">${item.tempo_de_infusao || '-'}</td>
                    <td class="col-aprazamento">${aprazamentoInput}</td>
            </tr>`;
        });
    });

    tabelaHtml += `</tbody></table>`;
    return tabelaHtml;
}

    // --- BLOCO DE EXECUÇÃO ---
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeContent);
    } else {
        initializeContent();
    }

    // --- Estilos ---
    const style = document.createElement('style');
    style.innerHTML = `.hidden { display: none; } body { font-family: sans-serif; line-height: 1.6; margin: 0 auto; max-width: 900px; padding: 20px; } header, footer { text-align: center; } section { border: 1px solid #ccc; padding: 20px; margin-bottom: 20px; border-radius: 8px; background-color: #f9f9f9; } h1, h2, h3, h4 { color: #0056b3; } form div { margin-bottom: 12px; display: flex; align-items: center; } label, strong { width: 180px; font-weight: bold; } input, select, textarea { padding: 8px; border-radius: 4px; border: 1px solid #ccc; width: calc(100% - 190px); } .search-container { position: relative; } .suggestions-list { position: absolute; top: 100%; left: 180px; right: 0; background-color: white; border: 1px solid #ccc; border-top: none; max-height: 200px; overflow-y: auto; z-index: 1000; } .suggestion-item { padding: 10px; cursor: pointer; } .suggestion-item:hover { background-color: #f0f0f0; } table { width: 100%; border-collapse: collapse; margin-top: 15px; } th, td { border: 1px solid #ddd; padding: 10px; } th { background-color: #e9ecef; } hr { border: 0; border-top: 1px solid #eee; margin: 25px 0; }`;
    document.head.appendChild(style);
});