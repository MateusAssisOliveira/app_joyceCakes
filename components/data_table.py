import flet as ft
from decimal import Decimal
from typing import List, Dict, Optional, Callable

class Table:
    def __init__(self):
        """
        Inicializa a tabela com estilo padrão.
        """
        self.data_table = ft.DataTable(
            columns=[],  # Colunas serão configuradas sem texto visível
            border=ft.border.only(
                left=ft.border.BorderSide(1, "#e0e0e0"),
                right=ft.border.BorderSide(1, "#e0e0e0"),
                bottom=ft.border.BorderSide(1, "#e0e0e0")
            ),
            horizontal_lines=ft.border.BorderSide(1, "#e0e0e0"),
            vertical_lines=ft.border.BorderSide(1, "#e0e0e0"),
            data_row_min_height=40,
            data_row_max_height=40,
            heading_row_height=0,  # Esconde o cabeçalho nativo
            divider_thickness=0,
            column_spacing=20,
            expand=True
        )
        self.rows_data: List[Dict] = []
        self.selected_row_data: Optional[Callable] = None
        self.header_container = ft.Row()  # Container para o título
        self.table_container = ft.Container(expand=True)  # Container para a tabela rolável

    def set_data(self, headers: List[str], rows: List[Dict]) -> Dict:
        """
        Define os dados da tabela com tratamento de erro.

        :param headers: lista de strings com nomes das colunas
        :param rows: lista de dicionários contendo os dados
        :return: dict com sucesso e, se erro, mensagem

        """
        
        try:
            if not headers or not isinstance(headers, list):
                return {
                    "success": False,
                    "error": "Cabeçalhos inválidos: deve ser uma lista não vazia"
                }

            if not rows:
                return {
                    "success": False,
                    "error": "Dados inválidos: deve ser uma lista não vazia"
                }

            #>
            """ self.data_table.columns = [
                ft.DataColumn(ft.Text(header.upper())) 
                for header in headers
            ] """
            #<

            self.data_table.columns = [
                ft.DataColumn(ft.Text(' ')) 
                for header in headers
            ]
            
            self.header_container.controls = [
                ft.Container(
                    content=ft.Text(
                        header.upper(),
                        weight=ft.FontWeight.BOLD,
                        size=14,
                        color=ft.Colors.WHITE
                    ),
                    padding=10,
                    width=150,  
                    bgcolor=ft.Colors.BLUE_700,
                    alignment=ft.alignment.center,
                    border_radius=ft.border_radius.only(top_left=5, top_right=5),
                    expand=True
                
                )
                for header in headers
            ]
            
            self.rows_data = rows
            self.data_table.rows = []

            for i, row in enumerate(rows):
                if not isinstance(row, dict):
                    return {
                        "success": False,
                        "error": f"Linha {i} não é um dicionário válido: {row}"
                    }

                cells = [
                    ft.DataCell(self._format_cell(row.get(header, "")))
                    for header in headers
                ]

                self.data_table.rows.append(
                    ft.DataRow(
                        cells=cells,
                        on_select_changed=lambda e, idx=i: self._handle_row_click(idx)
                    )
                )

            scrollable_table = ft.ListView(
                controls=[self.data_table],
                expand=True,
                spacing=0,
                padding=0
            )

            self.table_container.content = scrollable_table
            self.table_container.border = ft.border.only(
                bottom=ft.border.BorderSide(1, "#e0e0e0"),
                left=ft.border.BorderSide(1, "#e0e0e0"),
                right=ft.border.BorderSide(1, "#e0e0e0")
            )


            return {
                "success": True,
                "total_rows": len(rows),
                "columns": headers
            }

        except Exception as e:
            return {
                "success": False,
                "error": f"Erro ao construir tabela: {str(e)}"
            }

    def _handle_row_click(self, row_index: int) -> None:
        """Manipula o clique na linha e chama o callback com os dados da linha"""
        if self.selected_row_data and 0 <= row_index < len(self.rows_data):
            self.selected_row_data(self.rows_data[row_index])

    def _format_cell(self, value) -> ft.Text:
        """
        Formata o valor da célula para exibição.
        
        :param value: valor da célula
        :return: widget ft.Text formatado
        """
        if isinstance(value, Decimal):
            return ft.Text(f"R$ {abs(value):.2f}" if value >= 0 else f"-R$ {abs(value):.2f}")
        elif value is None:
            return ft.Text("")
        return ft.Text(str(value)
        
        )

    def set_callback_handle_row_click(self, callback: Callable) -> None:
        """Define a função de callback para clique em linha"""
        self.selected_row_data = callback

    def build(self) -> ft.Container:
        """Retorna o widget Container com a tabela pronta para uso"""
        return ft.Column(
            controls=[
                self.header_container,  # Título fixo
                ft.Container(
                    content=ft.Column(
                        controls=[self.table_container],
                        spacing=0,
                        expand=True
                    ),
                    expand=True,
                    border_radius=ft.border_radius.only(bottom_left=5, bottom_right=5)
                )
            ],
            spacing=0,
            expand=True
        )
