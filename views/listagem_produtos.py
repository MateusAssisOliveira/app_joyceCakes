import flet as ft
from controllers.produto_controller import ProdutoController
from config.logger_config import ConfigurarLogger  # ajuste o caminho conforme sua estrutura


class ListagemProdutos(ft.Column):
    def __init__(self):
        super().__init__()
        self.logger = ConfigurarLogger.configurar("ListagemProdutos", log_em_arquivo=True)

        self._produto_ativo = None

        self.tabela = ft.DataTable(
            columns=[
                ft.DataColumn(ft.Text("ID")),
                ft.DataColumn(ft.Text("Nome")),
                ft.DataColumn(ft.Text("Descrição")),
                ft.DataColumn(ft.Text("Preço")),
                ft.DataColumn(ft.Text("Quantidade")),
                ft.DataColumn(ft.Text("Tipo")),
            ],
            rows=[]
        )

        self.controls.extend([
            ft.Text("Lista de Produtos", size=20, weight="bold"),
            self.tabela
        ])

        self.carregar_produtos()

    def log_info(self, mensagem):
        self.logger.info(mensagem)

    def log_error(self, mensagem, exception=None):
        self.logger.error(f"{mensagem} - Erro: {exception}", exc_info=True)

    def celula(self, texto, selecionado=False, alinhamento=ft.alignment.center_left):
        return ft.DataCell(
            ft.Container(
                content=ft.Text(
                    str(texto),
                    weight="bold" if selecionado else "normal",
                    color=ft.colors.BLUE_900 if selecionado else ft.colors.BLACK,
                    size=12
                ),
                padding=ft.padding.symmetric(horizontal=6, vertical=4),
                alignment=alinhamento,
                height=36,
            )
        )

    def montar_linha_produto(self, produto):
        selecionado = self._produto_ativo == produto.id
        self.log_info(f"Montando linha para produto: {produto.nome} (Selecionado: {selecionado})")

        return ft.DataRow(
            cells=[
                self.celula(produto.id, selecionado, alinhamento=ft.alignment.center),
                self.celula(produto.nome, selecionado),
                self.celula(produto.descricao, selecionado),
                self.celula(f"R$ {produto.preco:.2f}", selecionado, alinhamento=ft.alignment.center),
                self.celula(produto.quantidade, selecionado, alinhamento=ft.alignment.center),
                self.celula(produto.tipo, selecionado, alinhamento=ft.alignment.center),
            ],
            on_select_changed=lambda e: self.selecionar_produto(produto),
            selected=selecionado,
        )

    def mostrar_mensagem_na_tabela(self, mensagem):
        self.tabela.rows.append(
            ft.DataRow(
                cells=[self.celula(mensagem, alinhamento=ft.alignment.center)]
                + [self.celula("") for _ in range(5)]
            )
        )

    def carregar_produtos(self, produtos=None):
        self.log_info("🔄 Carregando produtos...")
        self.tabela.rows.clear()

        try:
            produtos = produtos or ProdutoController.listar_produtos()

            if not produtos:
                self.log_info("Nenhum produto encontrado.")
                self.mostrar_mensagem_na_tabela("Nenhum produto encontrado.")
                return

            for produto in produtos:
                self.log_info(
                    f"Adicionando produto: ID={produto.id}, Nome={produto.nome}, "
                    f"Preço={produto.preco}, Quantidade={produto.quantidade}, Tipo={produto.tipo}"
                )
                self.tabela.rows.append(self.montar_linha_produto(produto))

            self.log_info("✅ Produtos carregados com sucesso.")
            self.tabela.update()

        except Exception as e:
            self.log_error("Erro ao carregar produtos", e)
            self.mostrar_mensagem_na_tabela("Erro ao carregar produtos")

    def atualizar_tabela(self, produtos=None):
        self.log_info("Atualizando tabela...")
        self.carregar_produtos(produtos)
        self.update()

    def selecionar_produto(self, produto):
        self.log_info(f"Produto selecionado: ID={produto.id}, Nome={produto.nome}")
        self._produto_ativo = produto.id
        self.atualizar_tabela()

    def editar_produto(self, e):
        self.log_info(f"Solicitação de edição: {e}")
        print("Editar produto")

    def excluir_produto(self, e):
        self.log_info(f"Solicitação de exclusão: {e}")
        print("Excluir produto")
