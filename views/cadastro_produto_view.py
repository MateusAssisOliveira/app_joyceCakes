import logging
import flet as ft
from controllers.produto_controller import ProdutoController
from models.produto import Produto

logger = logging.getLogger(__name__)

class CadastroProduto(ft.AlertDialog):
    def __init__(self, on_save, produto=None):
        super().__init__()
        self.on_save = on_save
        self.produto = produto
        self.modo_edicao = produto is not None
        
        # Configuração da UI
        self.title = ft.Text("Editar Produto" if self.modo_edicao else "Cadastro de Produto")
        self.mensagem_erro = ft.Text("", color="red")
        self._construir_formulario()
        
        if self.modo_edicao:
            self._preencher_campos()

    def _construir_formulario(self):
        """Configura os componentes visuais."""
        self.nome = ft.TextField(label="Nome", autofocus=True)
        self.descricao = ft.TextField(label="Descrição")
        self.preco = ft.TextField(label="Preço", input_filter=ft.NumbersOnlyInputFilter())
        self.quantidade = ft.TextField(label="Quantidade", input_filter=ft.NumbersOnlyInputFilter())
        self.tipo = ft.Dropdown(
            label="Tipo",
            options=[ft.dropdown.Option(tipo) for tipo in Produto.TIPOS_VALIDOS],
            value="unidade"
        )
        
        self.content = ft.Column([
            self.mensagem_erro,
            self.nome, self.descricao, 
            self.preco, self.quantidade, self.tipo
        ])
        
        self.actions = [
            ft.TextButton("Cancelar", on_click=self._cancelar),
            ft.ElevatedButton("Salvar", on_click=self._salvar)
        ]

    def _preencher_campos(self):
        """Preenche os campos para edição."""
        self.nome.value = self.produto.nome
        self.descricao.value = self.produto.descricao
        self.preco.value = str(self.produto.preco)
        self.quantidade.value = str(self.produto.quantidade)
        self.tipo.value = self.produto.tipo

    def _cancelar(self, e):
        self.open = False
        self.update()

    def _salvar(self, e):
        """Coleta dados e chama o Controller."""
        dados = {
            'nome': self.nome.value.strip(),
            'descricao': self.descricao.value.strip(),
            'preco': self.preco.value,
            'quantidade': self.quantidade.value,
            'tipo': self.tipo.value
        }
        
        if self.modo_edicao:
            dados['id'] = self.produto.id
        
        sucesso, mensagem = (
            ProdutoController.editar_produto(dados) 
            if self.modo_edicao 
            else ProdutoController.cadastrar_produto(dados)
        )
        
        if sucesso:
            self.open = False
            self.on_save()
        else:
            self.mensagem_erro.value = mensagem
        
        self.update()