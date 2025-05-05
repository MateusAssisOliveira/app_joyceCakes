import flet as ft
<<<<<<< HEAD
from controllers.produto_controller import ProdutoController
from models.produto import Produto
from views.paginacao import Paginacao

class ListagemProdutos:
    def __init__(self, page: ft.Page):
        self.page = page
        self._produto_selecionado = None
        self.pagina_atual = 1
        self.itens_por_pagina = 20
        self.coluna_ordenacao = "id"
        self.ordem_crescente = True

        # Configuração da tabela
        self.tabela = ft.DataTable(
            columns=[
                ft.DataColumn(ft.Text("ID", weight="bold"), on_sort=lambda e: self.ordenar_por("id")),
                ft.DataColumn(ft.Text("Nome", weight="bold"), on_sort=lambda e: self.ordenar_por("nome")),
                ft.DataColumn(ft.Text("Descrição", weight="bold")),
                ft.DataColumn(ft.Text("Preço", weight="bold"), on_sort=lambda e: self.ordenar_por("preco")),
                ft.DataColumn(ft.Text("Quantidade", weight="bold"), on_sort=lambda e: self.ordenar_por("quantidade")),
                ft.DataColumn(ft.Text("Tipo", weight="bold"), on_sort=lambda e: self.ordenar_por("tipo")),
            ],
            rows=[],
            sort_column_index=0,
            sort_ascending=True,
            heading_row_height=50,
            data_row_min_height=40,
            column_spacing=20,
            horizontal_margin=0,
            expand=True,
            vertical_lines=ft.border.BorderSide(1, ft.colors.BLACK38),
            horizontal_lines=ft.border.BorderSide(1, ft.colors.BLACK38),
            divider_thickness=0,
        )

        # Configuração da paginação
        self.paginacao = Paginacao(
            on_mudar_pagina=self.mudar_pagina,
            on_alterar_itens_por_pagina=self.alterar_itens_por_pagina
        )

        # Layout principal
        self.content = ft.Container(
            content=ft.Column(
                [
                    ft.Text("Lista de Produtos", size=24, weight="bold"),
                    ft.Container(
                        content=ft.Row(
                            [self.tabela],
                            expand=True,
                        ),
                        padding=20,
                        border=ft.border.all(1, ft.colors.OUTLINE),
                        border_radius=10,
                        expand=True,
                    ),
                    ft.Container(
                        content=self.paginacao,
                        padding=10                        
                    )
                ],
                spacing=10,
                expand=True,
            ),
            expand=True,
        )

        self.carregar_produtos()
        self.page.update()
        


    def mudar_pagina(self, incremento):
        nova_pagina = self.pagina_atual + incremento
        if nova_pagina < 1:
            return
            
        produtos, paginacao = ProdutoController.listar_produtos_paginados(
            pagina=nova_pagina, 
            por_pagina=self.itens_por_pagina
        )
        
        if produtos:
            self.pagina_atual = nova_pagina
            self.tabela.rows = self._criar_linhas_tabela(produtos)
            self.paginacao.atualizar(
                paginacao['pagina_atual'],
                paginacao['total_paginas'],
                paginacao['total_itens']
            )
            self.page.update()

    def alterar_itens_por_pagina(self, e):
        self.itens_por_pagina = int(e.control.value)
        self.pagina_atual = 1
        self.carregar_produtos()

    def carregar_produtos(self, produtos: list[Produto] | None = None) -> None:
        if produtos is not None:
            produtos_lista = produtos if isinstance(produtos, list) else [produtos]
            
            if produtos_lista:
                produtos_lista.sort(
                    key=lambda p: getattr(p, self.coluna_ordenacao),
                    reverse=not self.ordem_crescente
                )
            
            self.tabela.rows = self._criar_linhas_tabela(produtos_lista)
            self.page.update()
            return

        # Modo padrão com ordenação do banco
        produtos, paginacao = ProdutoController.listar_produtos_paginados(
            pagina=self.pagina_atual,
            por_pagina=self.itens_por_pagina,
            coluna_ordenacao=self.coluna_ordenacao,
            ordem_crescente=self.ordem_crescente
        )
        
        self.tabela.rows = self._criar_linhas_tabela(produtos)
        
        if self.paginacao:
            self.paginacao.atualizar(
                paginacao['pagina_atual'],
                paginacao['total_paginas'],
                paginacao['total_itens']
            )
        
        self.page.update()

    def ordenar_por(self, coluna):
        mapa_colunas = {
            "id": "id",
            "nome": "nome",
            "preco": "preco",
            "quantidade": "quantidade",
            "tipo": "tipo"
        }
        
        if coluna in mapa_colunas:
            nova_coluna = mapa_colunas[coluna]
            
            if self.coluna_ordenacao == nova_coluna:
                self.ordem_crescente = not self.ordem_crescente
            else:
                self.coluna_ordenacao = nova_coluna
                self.ordem_crescente = True

            self.tabela.sort_column_index = list(mapa_colunas.keys()).index(coluna)
            self.tabela.sort_ascending = self.ordem_crescente
            
            self.carregar_produtos()

        
    def _criar_linhas_tabela(self, produtos):
        if not produtos:
            return [ft.DataRow(cells=[ft.DataCell(ft.Text("Nenhum produto encontrado"))])]

        return [
            ft.DataRow(
                cells=[
                    ft.DataCell(ft.Text(str(produto.id))),
                    ft.DataCell(ft.Text(produto.nome)),
                    ft.DataCell(ft.Text(produto.descricao)),
                    ft.DataCell(ft.Text(f"R$ {produto.preco:.2f}")),
                    ft.DataCell(ft.Text(str(produto.quantidade))),
                    ft.DataCell(ft.Text(produto.tipo)),
                ],
                on_select_changed=lambda e, p=produto: self._selecionar_produto(p)
            ) for produto in produtos
        ]

    def ordenar_por(self, coluna):
        if self.coluna_ordenacao == coluna:
            self.ordem_crescente = not self.ordem_crescente
        else:
            self.coluna_ordenacao = coluna
            self.ordem_crescente = True

        colunas = ["id", "nome", "", "preco", "quantidade", "tipo"]
        if coluna in colunas:
            self.tabela.sort_column_index = colunas.index(coluna)
            self.tabela.sort_ascending = self.ordem_crescente

        self.carregar_produtos()

    def _selecionar_produto(self, produto: Produto) -> None:
        self._produto_selecionado = produto.id
        for row in self.tabela.rows:
            row.selected = (row.cells[0].content.value == str(produto.id))
        self.page.update()

    def obter_produto_selecionado(self) -> int | None:
        return self._produto_selecionado
=======
import logging
from controllers.produto_controller import ProdutoController
from functools import partial

# Configuração básica do logger
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ListagemProdutos(ft.Column):
    def __init__(self):

        self._produto_activo = None

        super().__init__()
        self.tabela = ft.DataTable(
            columns=[
                ft.DataColumn(ft.Text("ID")),
                ft.DataColumn(ft.Text("Nome")),
                ft.DataColumn(ft.Text("Descrição")),
                ft.DataColumn(ft.Text("Preço")),
                ft.DataColumn(ft.Text("Quantidade")),
                ft.DataColumn(ft.Text("Tipo"))
                ],
            rows=[]
        )

        # Carregar produtos e montar a UI
        self.carregar_produtos()

        self.controls = [
            ft.Text("Lista de Produtos", size=20, weight="bold"),
            self.tabela
        ]

    def carregar_produtos(self):
        logger.info("🔄 Carregando produtos...")  # Log de início de carregamento
        self.tabela.rows.clear()
        try:
            produtos = ProdutoController.listar_produtos()
            logger.info(f"Produtos carregados em carregar_produtos : {len(produtos)} produtos encontrados.")  # Log com o número de produtos encontrados


            if produtos:
                logger.info(f"Produtos carregados: {len(produtos)} produtos encontrados.")  # Log com o número de produtos encontrados
            else:
                logger.warning("Nenhum produto encontrado.")  # Log caso não haja produtos
                self.tabela.rows.append(
                    ft.DataRow(cells=[ft.DataCell(ft.Text("Nenhum produto encontrado."))])
                )
                return
            
            for produto in produtos:
                selecionado = self._produto_activo == produto.id
                logger.debug(f"Adicionando produto {produto.id}: {produto.nome}")  # Log de cada produto adicionado
                self.tabela.rows.append(
                    ft.DataRow(
                        
                        cells=[
                            ft.DataCell(ft.Text(str(produto.id))),
                            ft.DataCell(ft.Text(produto.nome)),
                            ft.DataCell(ft.Text(produto.descricao)),
                            ft.DataCell(ft.Text(f"R$ {produto.preco:.2f}")),
                            ft.DataCell(ft.Text(str(produto.quantidade))),
                            ft.DataCell(ft.Text(produto.tipo))
                            ],
                        on_select_changed=partial(self.selecionar_produto, produto),
                        selected=selecionado,
                        bgcolor=ft.colors.BLUE_100 if selecionado else None,

                    )
                )
        except Exception as e:
            logger.error(f"Erro ao carregar produtos: {e}")  # Log de erro se houver uma exceção

    def editar_produto(self, e):
        logger.info(f"Solicitação de edição para o produto {e}")  # Log quando um produto é solicitado para edição
        print("Editar produto")

    def excluir_produto(self, e):
        logger.info(f"Solicitação de exclusão para o produto {e}")  # Log quando um produto é solicitado para exclusão
        print("Excluir produto")

    def atualizar_tabela(self):
        logger.info("🔄 Atualizando tabela de produtos...")  # Log antes de atualizar a tabela
        self.carregar_produtos()
        self.update()

    def selecionar_produto(self, produto, is_selected=None, event=None):
        logger.info(f"Produto Selecionado{produto}")
        self._produto_activo = produto
>>>>>>> f08f16e695d0881e7c5fcdaa28b14b86b2e789f1
