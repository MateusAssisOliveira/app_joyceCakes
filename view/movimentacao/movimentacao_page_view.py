import flet as ft

class MovimentacaoPageView:
    """View da página de movimentação de estoque (entradas/saídas)."""

    def __init__(self):
        self.title = ft.Text("Movimentações de Estoque", size=20, weight=ft.FontWeight.BOLD)
        self.input_busca = ft.TextField(
            label="Buscar por nome do produto",
            hint_text="Digite o nome...",
            dense=True,
            prefix_icon=ft.Icons.SEARCH
        )
        self.tabela_movimentacoes = ft.DataTable(
            columns=[
                ft.DataColumn(label=ft.Text("ID")),
                ft.DataColumn(label=ft.Text("Produto")),
                ft.DataColumn(label=ft.Text("Tipo")),
                ft.DataColumn(label=ft.Text("Quantidade")),
                ft.DataColumn(label=ft.Text("Origem")),
                ft.DataColumn(label=ft.Text("Data")),
                ft.DataColumn(label=ft.Text("Usuário")),
                ft.DataColumn(label=ft.Text("Observações")),
            ],
            rows=[],
            heading_row_color=ft.colors.GREY_200,
            data_row_color=ft.colors.WHITE,
        )
        self.error_message = ft.Text("", color=ft.colors.RED_400, visible=False)
        self.botao_atualizar = ft.FloatingActionButton(
            icon=ft.icons.REFRESH,
            tooltip="Atualizar",
        )

    def construir_pagina(self) -> ft.Column:
        return ft.Column(
            controls=[
                self.title,
                self.input_busca,
                self.error_message,
                ft.Container(self.tabela_movimentacoes, expand=True),
                self.botao_atualizar
            ],
            expand=True,
            spacing=15,
            scroll=ft.ScrollMode.AUTO
        )

    def popular_tabela(self, dados: list):
        self.tabela_movimentacoes.rows.clear()
        for row in dados:
            self.tabela_movimentacoes.rows.append(
                ft.DataRow(
                    cells=[
                        ft.DataCell(ft.Text(str(row.get("id")))),
                        ft.DataCell(ft.Text(row.get("produto_nome", ""))),
                        ft.DataCell(ft.Text(row.get("tipo"))),
                        ft.DataCell(ft.Text(str(row.get("quantidade")))),
                        ft.DataCell(ft.Text(row.get("origem"))),
                        ft.DataCell(ft.Text(str(row.get("data_registro")))),
                        ft.DataCell(ft.Text(str(row.get("usuario_id")))),
                        ft.DataCell(ft.Text(row.get("observacoes", ""))),
                    ]
                )
            )

    def set_callback_busca(self, callback):
        self.input_busca.on_submit = callback

    def set_callback_atualizar(self, callback):
        self.botao_atualizar.on_click = callback

    def exibir_erro(self, mensagem: str):
        self.error_message.value = mensagem
        self.error_message.visible = True

    def limpar_erro(self):
        self.error_message.value = ""
        self.error_message.visible = False
