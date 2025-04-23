import inspect
from typing import Optional, Tuple, List, Union
from config.db import Database
from config.logger_config import ConfigurarLogger
from models.produto import Produto

logger = ConfigurarLogger.configurar("ProdutoController", log_em_arquivo=True)

class ProdutoController:

    @staticmethod
    def cadastrar_produto(produto_data: Produto) -> Tuple[bool, str]:
        logger.info(f"Dados recebidos para cadastro: {produto_data}")

        # Validação dos campos obrigatórios
        if not produto_data.nome or produto_data.descricao is None or produto_data.tipo is None:
            logger.warning("Preencha todos os campos obrigatórios!")
            return False, "Preencha todos os campos obrigatórios!"

        # Validação do preço
        try:
            preco = float(produto_data.preco)
        except ValueError as e:
            logger.error("Preço inválido!", exc_info=True)
            return False, "Preço inválido!"

        # Validação da quantidade
        if produto_data.quantidade is None:
            logger.error("Quantidade inválida!")
            return False, "Quantidade inválida!"

        try:
            quantidade = int(produto_data.quantidade)
        except ValueError:
            logger.error("Quantidade inválida (erro na conversão)!", exc_info=True)
            return False, "Quantidade inválida!"

        # Query de inserção
        query = """
            INSERT INTO produtos (nome, descricao, preco, quantidade, tipo) 
            VALUES (%s, %s, %s, %s, %s)
        """
        valores = (
            produto_data.nome,
            produto_data.descricao,
            preco,
            quantidade,
            produto_data.tipo
        )

        logger.info(f"Valores a serem inseridos no banco: {valores}")
        
        with Database() as db:
            if db.execute_query(query, valores):
                logger.info("✅ Produto cadastrado com sucesso!")
                return True, "Produto cadastrado com sucesso!"
            
            logger.error("❌ Erro ao cadastrar o produto.")
            return False, "Erro ao cadastrar o produto!"

    @staticmethod
    def listar_produtos_paginados(pagina: int = 1, por_pagina: int = 20) -> Tuple[List[Produto], dict]:
        offset = (pagina - 1) * por_pagina
        
        # Query para produtos paginados
        query = """
            SELECT id, nome, descricao, preco, quantidade, tipo 
            FROM produtos
            ORDER BY id
            LIMIT %s OFFSET %s
        """
        
        # Query para contagem total
        count_query = "SELECT COUNT(*) as total FROM produtos"
        
        with Database() as db:
            try:
                # Busca produtos paginados
                resultados = db.fetch_data(query, (por_pagina, offset))
                
                # Busca total de produtos
                total_result = db.fetch_data(count_query)
                total = total_result[0]['total'] if total_result else 0
                
                # Calcula paginação
                total_paginas = (total + por_pagina - 1) // por_pagina if por_pagina > 0 else 0
                
                produtos = [Produto(**produto) for produto in resultados] if resultados else []
                
                return produtos, {
                    'pagina_atual': pagina,
                    'por_pagina': por_pagina,
                    'total_itens': total,
                    'total_paginas': total_paginas,
                    'tem_proxima': pagina < total_paginas,
                    'tem_anterior': pagina > 1
                }
                
            except Exception as e:
                logger.error(f"Erro ao listar produtos paginados: {e}", exc_info=True)
                return [], {
                    'pagina_atual': 1,
                    'por_pagina': por_pagina,
                    'total_itens': 0,
                    'total_paginas': 0,
                    'tem_proxima': False,
                    'tem_anterior': False
                }

    @staticmethod
    def listar_produtos() -> List[Produto]:
        """Método mantido para compatibilidade"""
        produtos, _ = ProdutoController.listar_produtos_paginados(1, 1000)
        return produtos

    @staticmethod
    def obter_produto_por_id(produto_id: int) -> Optional[Produto]:
        query = "SELECT * FROM produtos WHERE id=%s"
        
        with Database() as db:
            resultado = db.fetch_data(query, (produto_id,))
            
            if resultado:
                logger.info(f"Produto encontrado com ID {produto_id}: {resultado[0]}")
                return Produto(**resultado[0])
            
            logger.warning(f"Produto com ID {produto_id} não encontrado.")
            return None

    @staticmethod
    def buscar_produto_por_nome(nome: str) -> List[Produto]:
        if not nome:
            logger.warning("Nome do produto não fornecido.")
            return []

        query = "SELECT * FROM produtos WHERE nome LIKE %s"
        parametro = f"%{nome}%"

        with Database() as db:
            try:
                resultado = db.fetch_data(query, (parametro,))
                
                if resultado:
                    logger.info(f"{len(resultado)} produto(s) encontrados com nome parecido com '{nome}'.")
                    return [Produto(**row) for row in resultado]
                
                logger.warning(f"Nenhum produto encontrado com nome parecido com '{nome}'.")
                return []
                
            except Exception as e:
                logger.error(f"Erro ao buscar produtos por nome '{nome}': {e}", exc_info=True)
                return []

    @staticmethod
    def buscar_produto(termo: str) -> Union[Produto, List[Produto], None]:
        if not termo or not termo.strip():
            logger.warning("Termo de busca vazio ou nulo.")
            return []

        if termo.isdigit():
            logger.info(f"Buscando produto por ID: {termo}")
            return ProdutoController.obter_produto_por_id(termo)
        
        logger.info(f"Buscando produto por nome: {termo}")
        return ProdutoController.buscar_produto_por_nome(termo)

    @staticmethod
    def deletar_produto(produto_id: int) -> bool:
        query = "DELETE FROM produtos WHERE id=%s"
        
        with Database() as db:
            sucesso = db.execute_query(query, (produto_id,))
            
            if sucesso:
                logger.info(f"Produto com ID {produto_id} deletado com sucesso.")
            else:
                logger.warning(f"Falha ao deletar o produto com ID {produto_id}.")
            
            return sucesso
    
    @staticmethod
    def editar_produto(produto_data: Produto) -> Tuple[bool, str]:
        logger.info(f"Dados recebidos para edição (ID {produto_data.id}): {produto_data}")

        # Validação dos campos
        if not produto_data.nome or produto_data.descricao is None or produto_data.tipo is None:
            logger.warning("Preencha todos os campos obrigatórios para edição!")
            return False, "Preencha todos os campos obrigatórios!"

        try:
            preco = float(produto_data.preco)
        except ValueError:
            logger.error("Preço inválido!", exc_info=True)
            return False, "Preço inválido!"

        if produto_data.quantidade is None:
            logger.error("Quantidade inválida!")
            return False, "Quantidade inválida!"

        try:
            quantidade = int(produto_data.quantidade)
        except ValueError:
            logger.error("Quantidade inválida (erro na conversão)!", exc_info=True)
            return False, "Quantidade inválida!"

        # Query de atualização
        query = """
            UPDATE produtos
            SET nome = %s, descricao = %s, preco = %s, quantidade = %s, tipo = %s
            WHERE id = %s
        """
        valores = (
            produto_data.nome,
            produto_data.descricao,
            preco,
            quantidade,
            produto_data.tipo,
            produto_data.id
        )

        logger.info(f"Valores para atualização do produto com ID {produto_data.id}: {valores}")
        
        with Database() as db:
            if db.execute_query(query, valores):
                logger.info(f"✅ Produto com ID {produto_data.id} atualizado com sucesso!")
                return True, "Produto atualizado com sucesso!"
            
            logger.error(f"❌ Erro ao atualizar o produto com ID {produto_data.id}.")
            return False, "Erro ao atualizar o produto!"