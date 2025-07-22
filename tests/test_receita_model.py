import unittest
from unittest.mock import Mock, patch
from datetime import datetime

from model.receitas.receitas_model import ReceitasModel

class TestReceitasModel(unittest.TestCase):
    def setUp(self):
        """Configuração inicial para cada teste"""
        self.mock_db = Mock()
        self.mock_logger = Mock()
        self.receitas_model = ReceitasModel(self.mock_db, self.mock_logger)
        
        # Dados de exemplo para testes
        self.dados_receita_exemplo = {
            'nome': 'Bolo de Chocolate',
            'descricao': 'Delicioso bolo de chocolate',
            'categoria_id': 1,
            'modo_preparo': 'Misturar tudo e assar',
            'tempo_preparo': 60,
            'rendimento': 10,
            'unidade_medida_id': 1,
            'dificuldade': 'medio',
            'custo_estimado': 50.0,
            'calorias_por_porcao': 350
        }
        
        self.ingrediente_exemplo = {
            'produto_id': 1,
            'quantidade': 2,
            'unidade_medida_id': 1
        }

    def test_buscar_receitas_paginadas_sem_filtros(self):
        """Testa a busca paginada de receitas sem filtros"""
        # Configurar mocks
        self.mock_db.fetch_all.side_effect = [
            [{'id': 1, 'nome_receita': 'Bolo'}],  # Dados
            [{'total': 1}]  # Contagem
        ]
        
        # Executar - agora pegamos apenas o resultado (pois o método retorna um dict)
        resultado = self.receitas_model.buscar_receitas_paginadas()
        
        # Verificar
        self.assertIsInstance(resultado, dict)
        self.assertEqual(resultado['dados'][0]['nome_receita'], 'Bolo')
        self.assertEqual(resultado['total_registros'], 1)
        self.mock_logger.info.assert_called_with("1 receitas encontradas na página 1")
        
    def test_buscar_receitas_paginadas_com_filtros(self):
        """Testa a busca paginada com filtros de pesquisa"""
        # Configurar mocks
        self.mock_db.fetch_all.side_effect = [
            [{'id': 1, 'nome_receita': 'Bolo'}],  # Dados
            [{'total': 1}]  # Contagem
        ]
        
        # Executar com filtro de busca - agora pegamos apenas o resultado
        resultado = self.receitas_model.buscar_receitas_paginadas(
            filtros={'search': 'bolo'}
        )
        
        # Verificar
        self.assertIsInstance(resultado, dict)
        self.assertIn('WHERE', self.mock_db.fetch_all.call_args_list[0][0][0])
        self.mock_logger.info.assert_called()
        
    def test_buscar_receita_completa_encontrada(self):
        """Testa a busca de uma receita completa quando existe"""
        # Configurar mock
        self.mock_db.fetch_all.return_value = [{'id': 1, 'nome': 'Bolo'}]
        
        # Executar - agora o método retorna uma tupla
        receita, erro = self.receitas_model.buscar_receita_completa(1)
        
        # Verificar
        self.assertIsNone(erro)
        self.assertEqual(receita['nome'], 'Bolo')
        self.mock_db.fetch_all.assert_called_once()
        
    def test_buscar_receita_completa_nao_encontrada(self):
        """Testa a busca de uma receita que não existe"""
        # Configurar mock
        self.mock_db.fetch_all.return_value = []
        
        # Executar
        receita, erro = self.receitas_model.buscar_receita_completa(999)
        
        # Verificar
        self.assertIsNone(receita)
        self.assertEqual(erro, "Receita ID 999 não encontrada")
        self.mock_logger.error.assert_not_called()
        
    def test_inserir_receita_sucesso(self):
        """Testa a inserção bem-sucedida de uma receita"""
        # Configurar mock
        self.mock_db.execute.return_value = 1  # Simula inserção com ID 1
        
        # Executar
        receita_id, erro = self.receitas_model.inserir_receita(self.dados_receita_exemplo)
        
        # Verificar
        self.assertIsNone(erro)
        self.assertEqual(receita_id, 1)
        self.mock_db.execute.assert_called_once()
        self.mock_logger.error.assert_not_called()
        
    def test_inserir_receita_erro(self):
        """Testa a inserção de receita com erro no banco"""
        # Configurar mock para lançar exceção
        self.mock_db.execute.side_effect = Exception("Erro de banco")
        
        # Executar
        receita_id, erro = self.receitas_model.inserir_receita(self.dados_receita_exemplo)
        
        # Verificar
        self.assertIsNone(receita_id)
        self.assertEqual(erro, "Erro de banco")
        self.mock_logger.error.assert_called()
        
    def test_inserir_ingrediente_sucesso(self):
        """Testa a inserção bem-sucedida de um ingrediente"""
        # Configurar mock
        self.mock_db.execute.return_value = 1  # 1 linha afetada
        
        # Executar
        sucesso, erro = self.receitas_model.inserir_ingrediente(1, self.ingrediente_exemplo)
        
        # Verificar
        self.assertTrue(sucesso)
        self.assertIsNone(erro)
        self.mock_db.execute.assert_called_once()
        
    def test_atualizar_custo_receita_sucesso(self):
        """Testa a atualização do custo de uma receita"""
        # Configurar mock
        self.mock_db.execute.return_value = 1  # 1 linha afetada
        
        # Executar
        sucesso, erro = self.receitas_model.atualizar_custo_receita(1)
        
        # Verificar
        self.assertTrue(sucesso)
        self.assertIsNone(erro)
        self.mock_db.execute.assert_called_once()
        
    def test_atualizar_receita_sucesso(self):
        """Testa a atualização bem-sucedida de uma receita"""
        # Configurar mock
        self.mock_db.execute.return_value = 1  # 1 linha afetada
        
        # Dados para atualização
        dados_atualizacao = {
            'nome': 'Bolo Atualizado',
            'descricao': 'Nova descrição'
        }
        
        # Executar
        sucesso, erro = self.receitas_model.atualizar_receita(1, dados_atualizacao)
        
        # Verificar
        self.assertTrue(sucesso)
        self.assertIsNone(erro)
        self.mock_db.execute.assert_called_once()
        
    def test_excluir_receita_sucesso(self):
        """Testa a exclusão bem-sucedida de uma receita"""
        # Configurar mock para duas chamadas (ingredientes e receita)
        self.mock_db.execute.side_effect = [1, 1]
        
        # Executar
        sucesso, erro = self.receitas_model.excluir_receita(1)
        
        # Verificar
        self.assertTrue(sucesso)
        self.assertIsNone(erro)
        self.assertEqual(self.mock_db.execute.call_count, 2)
        
    def test_excluir_receita_erro(self):
        """Testa a exclusão de receita com erro"""
        # Configurar mock para lançar exceção
        self.mock_db.execute.side_effect = Exception("Erro de banco")
        
        # Executar
        sucesso, erro = self.receitas_model.excluir_receita(1)
        
        # Verificar
        self.assertFalse(sucesso)
        self.assertEqual(erro, "Erro de banco")
        self.mock_logger.error.assert_called()
        
    def test_buscar_ingredientes_receita_sucesso(self):
        """Testa a busca de ingredientes de uma receita"""
        # Configurar mock
        self.mock_db.fetch_all.return_value = [{'id': 1, 'nome': 'Farinha'}]
        
        # Executar - agora o método retorna apenas a lista de ingredientes
        ingredientes = self.receitas_model._buscar_ingredientes_receita(1)
        
        # Verificar
        self.assertEqual(len(ingredientes), 1)
        self.assertEqual(ingredientes[0]['nome'], 'Farinha')
        self.mock_db.fetch_all.assert_called_once()
        
    def test_buscar_ingredientes_receita_vazia(self):
        """Testa a busca de ingredientes quando a receita não tem nenhum"""
        # Configurar mock
        self.mock_db.fetch_all.return_value = []
        
        # Executar
        ingredientes = self.receitas_model._buscar_ingredientes_receita(1)
        
        # Verificar
        self.assertEqual(len(ingredientes), 0)
        self.mock_logger.error.assert_not_called()

if __name__ == '__main__':
    unittest.main()