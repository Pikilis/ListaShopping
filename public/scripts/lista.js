
class GerenciadorLista {
    constructor() {
        this.produtos = this.carregarProdutos();
        this.listaCompras = this.carregarListaCompras();
        this.inicializar();
    }

    inicializar() {
        this.configurarEventos();
        this.atualizarListaCompras();
        this.atualizarProgresso();
        this.verificarEnvioServidor();
    }

    configurarEventos() {
        document.getElementById('btnEnviarServidor').addEventListener('click', () => {
            this.enviarParaServidor();
        });
    }

    carregarProdutos() {
        const produtos = localStorage.getItem('listaProdutos');
        return produtos ? JSON.parse(produtos) : [];
    }

    carregarListaCompras() {
        const lista = localStorage.getItem('listaCompras');
        return lista ? JSON.parse(lista) : [];
    }

    salvarListaCompras() {
        localStorage.setItem('listaCompras', JSON.stringify(this.listaCompras));
    }

    obterDescricaoUnidade(sigla) {
        const unidades = {
            'un': 'Unidade',
            'kg': 'Quilograma',
            'lt': 'Litro',
            'mt': 'Metro',
            'pc': 'Pacote'
        };
        return unidades[sigla] || sigla;
    }

    inicializarListaCompras() {
        // Criar lista de compras baseada nos produtos ativos
        const produtosAtivos = this.produtos.filter(p => p.ativo);
        
        this.listaCompras = produtosAtivos.map(produto => {
            const itemExistente = this.listaCompras.find(item => item.codigoProduto === produto.codigoProduto);
            
            return {
                codigoProduto: produto.codigoProduto,
                nomeProduto: produto.nomeProduto,
                unidade: produto.unidade,
                quantidadeNecessaria: produto.quantidade,
                quantidadeComprada: itemExistente ? itemExistente.quantidadeComprada : 0,
                coletado: itemExistente ? itemExistente.coletado : false
            };
        });

        this.salvarListaCompras();
    }

    atualizarQuantidadeComprada(codigoProduto, quantidade) {
        const item = this.listaCompras.find(item => item.codigoProduto === codigoProduto);
        if (item) {
            item.quantidadeComprada = Math.max(0, parseFloat(quantidade) || 0);
            
            // Verificar se deve marcar como coletado automaticamente
            item.coletado = item.quantidadeComprada >= item.quantidadeNecessaria;
            
            this.salvarListaCompras();
            this.atualizarProgresso();
            this.verificarEnvioServidor();
            this.atualizarEstiloLinha(codigoProduto);
        }
    }

    alternarColetado(codigoProduto) {
        const item = this.listaCompras.find(item => item.codigoProduto === codigoProduto);
        if (item) {
            item.coletado = !item.coletado;
            this.salvarListaCompras();
            this.atualizarProgresso();
            this.verificarEnvioServidor();
            this.atualizarEstiloLinha(codigoProduto);
        }
    }

    atualizarEstiloLinha(codigoProduto) {
        const linha = document.querySelector(`tr[data-produto="${codigoProduto}"]`);
        const item = this.listaCompras.find(item => item.codigoProduto === codigoProduto);
        
        if (linha && item) {
            if (item.coletado) {
                linha.classList.add('produto-coletado');
            } else {
                linha.classList.remove('produto-coletado');
            }
        }
    }

    atualizarListaCompras() {
        this.inicializarListaCompras();
        
        const tbody = document.querySelector('#tabelaLista tbody');
        const mensagemVazia = document.getElementById('mensagemVazia');
        
        if (this.listaCompras.length === 0) {
            tbody.innerHTML = '';
            mensagemVazia.style.display = 'block';
            document.querySelector('.lista-compras').style.display = 'none';
            return;
        }

        mensagemVazia.style.display = 'none';
        document.querySelector('.lista-compras').style.display = 'block';
        tbody.innerHTML = '';

        this.listaCompras.forEach(item => {
            const row = document.createElement('tr');
            row.setAttribute('data-produto', item.codigoProduto);
            
            if (item.coletado) {
                row.classList.add('produto-coletado');
            }

            row.innerHTML = `
                <td>${item.codigoProduto}</td>
                <td>${item.nomeProduto}</td>
                <td>
                    <span class="unidade-desc">${this.obterDescricaoUnidade(item.unidade)}</span>
                </td>
                <td>${item.quantidadeNecessaria}</td>
                <td>
                    <input type="number" 
                           class="quantidade-input" 
                           value="${item.quantidadeComprada}" 
                           min="0" 
                           step="0.01"
                           onchange="gerenciadorLista.atualizarQuantidadeComprada(${item.codigoProduto}, this.value)">
                </td>
                <td>
                    <input type="checkbox" 
                           class="checkbox-coletado" 
                           ${item.coletado ? 'checked' : ''}
                           onchange="gerenciadorLista.alternarColetado(${item.codigoProduto})">
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    atualizarProgresso() {
        const totalItens = this.listaCompras.length;
        const itensColetados = this.listaCompras.filter(item => item.coletado).length;
        const porcentagem = totalItens > 0 ? (itensColetados / totalItens) * 100 : 0;

        document.getElementById('progressoTexto').textContent = 
            `${itensColetados} de ${totalItens} itens coletados`;
        
        document.getElementById('progressoFill').style.width = `${porcentagem}%`;
    }

    verificarEnvioServidor() {
        const todosColetados = this.listaCompras.length > 0 && 
                               this.listaCompras.every(item => item.coletado);
        
        const btnEnviar = document.getElementById('btnEnviarServidor');
        btnEnviar.style.display = todosColetados ? 'block' : 'none';
    }

    async enviarParaServidor() {
        try {
            // Preparar dados para envio
            const agora = Date.now();
            const proximoCodCompra = await this.obterProximoCodCompra();

            // Dados para a API de compras
            const dadosCompra = {
                data: agora,
                codcompras: proximoCodCompra.toString()
            };

            // Dados para a API de produtos
            const dadosProdutos = this.listaCompras.map(item => ({
                nome: item.nomeProduto,
                unidade: item.unidade,
                quantidade: item.quantidadeNecessaria,
                codigobarra: '', // Buscar do produto original se necessário
                ativo: true,
                quantcomprada: item.quantidadeComprada,
                codproduto: item.codigoProduto.toString(),
                codcompra: proximoCodCompra.toString()
            }));

            // Enviar para API de compras
            const respostaCompra = await fetch('https://684dec6c65ed087139177196.mockapi.io/api/compras/compras', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dadosCompra)
            });

            if (!respostaCompra.ok) {
                throw new Error('Erro ao enviar dados da compra');
            }

            // Enviar produtos individualmente
            for (const produto of dadosProdutos) {
                const respostaProduto = await fetch('https://684dec6c65ed087139177196.mockapi.io/api/compras/produtos', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(produto)
                });

                if (!respostaProduto.ok) {
                    console.warn('Erro ao enviar produto:', produto.nome);
                }
            }

            alert('Lista enviada para o servidor com sucesso!');
            
            // Limpar lista de compras
            this.listaCompras = [];
            this.salvarListaCompras();
            this.atualizarListaCompras();
            this.atualizarProgresso();
            this.verificarEnvioServidor();

        } catch (error) {
            console.error('Erro ao enviar para servidor:', error);
            alert('Erro ao enviar dados para o servidor. Tente novamente.');
        }
    }

    async obterProximoCodCompra() {
        try {
            const resposta = await fetch('https://684dec6c65ed087139177196.mockapi.io/api/compras/compras');
            
            if (resposta.ok) {
                const compras = await resposta.json();
                const maxCod = compras.length > 0 
                    ? Math.max(...compras.map(c => parseInt(c.codcompras) || 0))
                    : 0;
                return maxCod + 1;
            }
        } catch (error) {
            console.warn('Erro ao obter próximo código de compra:', error);
        }
        
        // Fallback: usar timestamp
        return Math.floor(Date.now() / 1000);
    }
}

// Inicializar o gerenciador quando a página carregar
let gerenciadorLista;
document.addEventListener('DOMContentLoaded', () => {
    gerenciadorLista = new GerenciadorLista();
});
