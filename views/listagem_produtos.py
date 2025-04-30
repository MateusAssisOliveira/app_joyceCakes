import flet as ft
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