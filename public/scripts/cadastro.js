
class GerenciadorProdutos {
    constructor() {
        this.produtos = this.carregarProdutos();
        this.produtoEditando = null;
        this.inicializar();
    }

    inicializar() {
        this.configurarEventos();
        this.atualizarTabelaProdutos();
        this.definirProximoCodigo();
    }

    configurarEventos() {
        document.getElementById('produtoForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.salvarProduto();
        });

        document.getElementById('btnCancelar').addEventListener('click', () => {
            this.cancelarEdicao();
        });

        document.getElementById('btnExcluir').addEventListener('click', () => {
            this.excluirProduto();
        });

        document.getElementById('codigoBarra').addEventListener('input', (e) => {
            this.validarCodigoBarra(e.target);
        });
    }

    carregarProdutos() {
        const produtos = localStorage.getItem('listaProdutos');
        return produtos ? JSON.parse(produtos) : [];
    }

    salvarProdutos() {
        localStorage.setItem('listaProdutos', JSON.stringify(this.produtos));
    }

    definirProximoCodigo() {
        if (!this.produtoEditando) {
            const maxCodigo = this.produtos.length > 0 
                ? Math.max(...this.produtos.map(p => p.codigoProduto))
                : 0;
            document.getElementById('codigoProduto').value = maxCodigo + 1;
        }
    }

    validarCodigoBarra(input) {
        const valor = input.value.replace(/\D/g, '');
        input.value = valor.substring(0, 13);
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

    validarFormulario() {
        const nomeProduto = document.getElementById('nomeProduto').value.trim();
        const unidade = document.getElementById('unidade').value;
        const quantidade = document.getElementById('quantidade').value;
        const codigoBarra = document.getElementById('codigoBarra').value.trim();

        if (!nomeProduto) {
            alert('Nome do produto é obrigatório!');
            return false;
        }

        if (!unidade) {
            alert('Unidade é obrigatória!');
            return false;
        }

        if (!quantidade || quantidade <= 0) {
            alert('Quantidade deve ser maior que zero!');
            return false;
        }

        if (codigoBarra && codigoBarra.length !== 13) {
            alert('Código de barras deve ter exatamente 13 dígitos!');
            return false;
        }

        if (codigoBarra && !/^\d{13}$/.test(codigoBarra)) {
            alert('Código de barras deve conter apenas números!');
            return false;
        }

        return true;
    }

    salvarProduto() {
        if (!this.validarFormulario()) {
            return;
        }

        const formData = new FormData(document.getElementById('produtoForm'));
        const produto = {
            codigoProduto: parseInt(formData.get('codigoProduto')),
            nomeProduto: formData.get('nomeProduto').trim(),
            unidade: formData.get('unidade'),
            quantidade: parseFloat(formData.get('quantidade')),
            codigoBarra: formData.get('codigoBarra').trim(),
            ativo: formData.get('ativo') === 'on'
        };

        if (this.produtoEditando) {
            // Atualizar produto existente
            const index = this.produtos.findIndex(p => p.codigoProduto === this.produtoEditando);
            if (index !== -1) {
                this.produtos[index] = produto;
            }
        } else {
            // Verificar se já existe produto com este código
            if (this.produtos.some(p => p.codigoProduto === produto.codigoProduto)) {
                alert('Já existe um produto com este código!');
                return;
            }
            this.produtos.push(produto);
        }

        this.salvarProdutos();
        this.atualizarTabelaProdutos();
        this.cancelarEdicao();
        alert('Produto salvo com sucesso!');
    }

    editarProduto(codigoProduto) {
        const produto = this.produtos.find(p => p.codigoProduto === codigoProduto);
        if (!produto) return;

        this.produtoEditando = codigoProduto;

        document.getElementById('codigoProduto').value = produto.codigoProduto;
        document.getElementById('nomeProduto').value = produto.nomeProduto;
        document.getElementById('unidade').value = produto.unidade;
        document.getElementById('quantidade').value = produto.quantidade;
        document.getElementById('codigoBarra').value = produto.codigoBarra || '';
        document.getElementById('ativo').checked = produto.ativo;

        document.getElementById('btnSalvar').textContent = 'Atualizar';
        document.getElementById('btnExcluir').style.display = 'inline-block';

        // Scroll para o formulário
        document.getElementById('produtoForm').scrollIntoView({ behavior: 'smooth' });
    }

    excluirProduto() {
        if (!this.produtoEditando) return;

        if (confirm('Tem certeza que deseja excluir este produto?')) {
            this.produtos = this.produtos.filter(p => p.codigoProduto !== this.produtoEditando);
            this.salvarProdutos();
            this.atualizarTabelaProdutos();
            this.cancelarEdicao();
            alert('Produto excluído com sucesso!');
        }
    }

    cancelarEdicao() {
        this.produtoEditando = null;
        document.getElementById('produtoForm').reset();
        document.getElementById('btnSalvar').textContent = 'Salvar';
        document.getElementById('btnExcluir').style.display = 'none';
        document.getElementById('ativo').checked = true;
        this.definirProximoCodigo();
    }

    atualizarTabelaProdutos() {
        const tbody = document.querySelector('#tabelaProdutos tbody');
        tbody.innerHTML = '';

        if (this.produtos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #7f8c8d;">Nenhum produto cadastrado</td></tr>';
            return;
        }

        this.produtos.forEach(produto => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${produto.codigoProduto}</td>
                <td>${produto.nomeProduto}</td>
                <td>${this.obterDescricaoUnidade(produto.unidade)}</td>
                <td>${produto.quantidade}</td>
                <td>${produto.codigoBarra || '-'}</td>
                <td>
                    <span class="${produto.ativo ? 'status-ativo' : 'status-inativo'}">
                        ${produto.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-editar" onclick="gerenciadorProdutos.editarProduto(${produto.codigoProduto})">
                        Editar
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }
}

// Inicializar o gerenciador quando a página carregar
let gerenciadorProdutos;
document.addEventListener('DOMContentLoaded', () => {
    gerenciadorProdutos = new GerenciadorProdutos();
});
