import logging
import flet as ft
from controllers.produto_controller import ProdutoController
from models.produto import Produto

# Configuração do logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

class CadastroProduto(ft.AlertDialog):
    def __init__(self, on_save):
        super().__init__()
        self.on_save = on_save
        self.title = ft.Text("Cadastro de Produto")

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
                ft.dropdown.Option("peso")
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

    def cancelar(self, e):
        logging.info("Cancelando o cadastro do produto...")  # Log de cancelamento
        self.open = False
        self.update()

    def salvar(self, e):
        logging.info("Iniciando processo de salvar produto...")  # Log de início de salvamento
        # Limpa mensagem anterior
        self.mensagem_erro.value = ""
        self.update()

        try:
            nome = self.nome.value.strip()
            descricao = self.descricao.value.strip()
            tipo = self.tipo.value
            logging.debug(f"Validação do nome: {nome}")  # Log de nome

            # Valida nome
            if not nome:
                logging.error("Erro: Nome vazio.")  # Log de erro de nome
                self.mostrar_erro("Nome do produto não pode ser vazio.")
                return

            # Valida preço
            try:
                preco = float(self.preco.value)
                logging.debug(f"Validação do preço: {preco}")  # Log do preço
                if preco < 0:
                    raise ValueError
            except ValueError:
                logging.error("Erro: Preço inválido.")  # Log de erro de preço
                self.mostrar_erro("Preço inválido. Use um número positivo.")
                return

            # Valida quantidade
            try:
                quantidade = int(self.quantidade.value)
                logging.debug(f"Validação da quantidade: {quantidade}")  # Log da quantidade
                if quantidade < 0:
                    raise ValueError
            except ValueError:
                logging.error("Erro: Quantidade inválida.")  # Log de erro de quantidade
                self.mostrar_erro("Quantidade inválida. Use um número inteiro positivo.")
                return

            novo_produto = Produto(
                _nome=nome,
                _descricao=descricao,
                _preco=preco,
                _quantidade=quantidade,
                _tipo=tipo
            )
            logging.info(f"Cadastrando produto: {novo_produto}")  # Log do produto sendo cadastrado

            ProdutoController.cadastrar_produto(novo_produto)
            logging.info("Produto cadastrado com sucesso!")  # Log de sucesso no cadastro
            self.open = False
            self.on_save()

        except Exception as err:
            logging.error(f"Erro inesperado: {err}")  # Log de erro inesperado
            self.mostrar_erro(f"Erro inesperado: {err}")
        self.update()

    def mostrar_erro(self, mensagem):
        logging.error(f"Erro exibido: {mensagem}")  # Log de erro exibido ao usuário
        self.mensagem_erro.value = mensagem
        self.update()
