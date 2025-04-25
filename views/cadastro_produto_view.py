import logging
import flet as ft
from controllers.produto_controller import ProdutoController
from models.produto import Produto

# Configuração do logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

class CadastroProduto(ft.AlertDialog):
    def __init__(self, on_save, produto = None):
        super().__init__()
        self.on_save = on_save
        self.produto = produto  # Armazena o produto para edição
        self.modo_edicao = produto is not None  # Define se está em modo de edição
        
        # Define o título baseado no modo
        self.title = ft.Text("Editar Produto" if self.modo_edicao else "Cadastro de Produto")

        self.mensagem_erro = ft.Text("", color="red")

        self.nome = ft.TextField(label="Nome", autofocus=True)
        self.descricao = ft.TextField(label="Descrição")

        self.preco = ft.TextField(
            label="Preço",
            keyboard_type=ft.KeyboardType.NUMBER,
            input_filter=ft.NumbersOnlyInputFilter()
        )
        self.quantidade = ft.TextField(
            label="Quantidade",
            keyboard_type=ft.KeyboardType.NUMBER,
            input_filter=ft.NumbersOnlyInputFilter()
        )

        self.tipo = ft.Dropdown(
            label="Tipo",
            options=[
                ft.dropdown.Option("unidade"),
                ft.dropdown.Option("kg"),
                ft.dropdown.Option("litro"),
                ft.dropdown.Option("pacote"),
                ft.dropdown.Option("caixa")
            ],
            value="unidade"
        )

        self.content = ft.Column([
            self.mensagem_erro,
            self.nome,
            self.descricao,
            self.preco,
            self.quantidade,
            self.tipo
        ])

        self.actions = [
            ft.TextButton("Cancelar", on_click=self.cancelar),
            ft.ElevatedButton("Salvar", on_click=self.salvar)
        ]

        # Se estiver em modo de edição, preenche os campos com os dados do produto
        if self.modo_edicao:
            self.preencher_campos()

    def preencher_campos(self):
        """Preenche os campos com os dados do produto em edição."""
        logging.info(f"Preenchendo campos para edição do produto: {self.produto}")
        self.nome.value = self.produto.nome
        self.descricao.value = self.produto.descricao
        self.preco.value = str(self.produto.preco)
        self.quantidade.value = str(self.produto.quantidade)
        self.tipo.value = self.produto.tipo

    def cancelar(self, e):
        logging.info("Cancelando o cadastro/edição do produto...")
        self.open = False
        self.update()

    def salvar(self, e):
        logging.info("Iniciando processo de salvar produto...")
        self.mensagem_erro.value = ""
        self.update()

        try:
            nome = self.nome.value.strip()
            descricao = self.descricao.value.strip()
            tipo = self.tipo.value
            logging.debug(f"Validação do nome: {nome}")

            if not nome:
                logging.error("Erro: Nome vazio.")
                self.mostrar_erro("Nome do produto não pode ser vazio.")
                return

            try:
                preco = float(self.preco.value)
                logging.debug(f"Validação do preço: {preco}")
                if preco < 0:
                    raise ValueError
            except ValueError:
                logging.error("Erro: Preço inválido.")
                self.mostrar_erro("Preço inválido. Use um número positivo.")
                return

            try:
                quantidade = int(self.quantidade.value)
                logging.debug(f"Validação da quantidade: {quantidade}")
                if quantidade < 0:
                    raise ValueError
            except ValueError:
                logging.error("Erro: Quantidade inválida.")
                self.mostrar_erro("Quantidade inválida. Use um número inteiro positivo.")
                return

            # Cria ou atualiza o produto conforme o modo
            if self.modo_edicao:
                # Modo edição - atualiza o produto existente
                produto_atualizado = Produto(
                    id=self.produto.id,
                    nome=nome,
                    descricao=descricao,
                    preco=preco,
                    quantidade=quantidade,
                    tipo=tipo
                )
                logging.info(f"Atualizando produto: {produto_atualizado}")
                ProdutoController.editar_produto(produto_atualizado)
                logging.info("Produto atualizado com sucesso!")
            else:
                # Modo cadastro - cria novo produto
                novo_produto = Produto(
                    id=None,
                    nome=nome,
                    descricao=descricao,
                    preco=preco,
                    quantidade=quantidade,
                    tipo=tipo
                )
                logging.info(f"Cadastrando produto: {novo_produto}")
                ProdutoController.cadastrar_produto(novo_produto)
                logging.info("Produto cadastrado com sucesso!")

            self.open = False
            self.on_save()

        except Exception as err:
            logging.error(f"Erro inesperado: {err}")
            self.mostrar_erro(f"Erro inesperado: {err}")
        self.update()

    def mostrar_erro(self, mensagem):
        logging.error(f"Erro exibido: {mensagem}")
        self.mensagem_erro.value = mensagem
        self.update()