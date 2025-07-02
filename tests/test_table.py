import unittest
from unittest.mock import MagicMock, patch
from decimal import Decimal
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from components.data_table import Table


class TestTable(unittest.TestCase):
    def setUp(self):
        """Configuração inicial para cada teste."""
        self.table = Table()
        self.sample_headers = ["ID", "Nome", "Preço"]
        self.sample_rows = [
            {"ID": 1, "Nome": "Produto A", "Preço": Decimal("10.50")},
            {"ID": 2, "Nome": "Produto B", "Preço": Decimal("20.00")},
        ]

    def test_initialization(self):
        """Testa se a tabela é inicializada corretamente."""
        self.assertEqual(len(self.table.data_table.columns), 0)
        self.assertEqual(len(self.table.data_table.rows), 0)
        self.assertIsNone(self.table.selected_row_data)

    def test_set_data_success(self):
        """Testa a inserção de dados válidos."""
        result = self.table.set_data(self.sample_headers, self.sample_rows)
        
        self.assertTrue(result["success"])
        self.assertEqual(result["total_rows"], 2)
        self.assertEqual(len(self.table.data_table.rows), 2)
        
        # Verifica se os cabeçalhos foram criados
        self.assertEqual(
            [col.label.value for col in self.table.data_table.columns],
            ["ID", "NOME", "PREÇO"]  # Verifica se os headers estão em maiúsculas
        )

    def test_set_data_empty_headers(self):
        """Testa o comportamento com cabeçalhos vazios."""
        result = self.table.set_data([], self.sample_rows)
        self.assertFalse(result["success"])
        self.assertIn("Cabeçalhos inválidos", result["error"])
        self.assertEqual(result["error"], "Cabeçalhos inválidos: deve ser uma lista não vazia")

    def test_handle_row_click(self):
        """Testa o callback de clique em uma linha."""
        mock_callback = MagicMock()
        self.table.set_callback_handle_row_click(mock_callback)
        self.table.set_data(self.sample_headers, self.sample_rows)
        
        # Simula clique na primeira linha (índice 0)
        self.table._handle_row_click(0)
        
        # Verifica se o callback foi chamado com os dados corretos
        mock_callback.assert_called_once_with(self.sample_rows[0])

    def test_format_cell(self):
        """Testa a formatação de valores nas células."""
        # Decimal positivo
        cell = self.table._format_cell(Decimal("15.99"))
        self.assertEqual(cell.value, "R$ 15.99")
        
        # Decimal negativo
        cell = self.table._format_cell(Decimal("-5.50"))
        self.assertEqual(cell.value, "-R$ 5.50")
        
        # None
        cell = self.table._format_cell(None)
        self.assertEqual(cell.value, "")
        
        # String
        cell = self.table._format_cell("Teste")
        self.assertEqual(cell.value, "Teste")

    @patch("components.data_table.ft.Container")

    def test_build(self, mock_container):
        """Testa se o widget é construído sem erros."""
        widget = self.table.build()
        mock_container.assert_called_once()
        self.assertEqual(widget, mock_container.return_value)

if __name__ == "__main__":
    unittest.main()