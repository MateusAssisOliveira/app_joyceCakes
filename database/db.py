import pymysql
from pymysql.err import MySQLError as Error
from pymysql.cursors import DictCursor
from dotenv import load_dotenv
import os
import logging
from typing import Optional, List, Dict, Union, Any, Tuple

class Database:
    def __init__(self):
        """Inicializa a conexão com o banco de dados com DictCursor padrão"""
        load_dotenv()
        self.host = os.getenv('DB_HOST', 'localhost')
        self.user = os.getenv('DB_USER', 'root')
        self.password = os.getenv('DB_PASSWORD', '')
        self.database = os.getenv('DB_DATABASE', 'joyce_cakes')
        self.port = int(os.getenv('DB_PORT', 3306))
        self.connection = None
        self._validate_credentials()
        self.connect_timeout = 10
        self.read_timeout = 30
        self.write_timeout = 30
        self.cursor_class = DictCursor  # Usaremos DictCursor por padrão

    def is_connected(self) -> bool:
        """Verifica se a conexão está ativa"""
        return self.connection is not None and self.connection.open

    def _validate_credentials(self):
        """Valida se as credenciais mínimas estão configuradas"""
        required = {
            'host': self.host,
            'user': self.user,
            'database': self.database
        }
        missing = [k for k, v in required.items() if not v]
        if missing:
            error_msg = f"Credenciais do banco de dados incompletas. Faltando: {', '.join(missing)}"
            logging.error(f"❌ {error_msg}")
            raise ValueError(error_msg)

    def connect(self) -> bool:
        """Estabelece conexão com o banco de dados usando DictCursor"""
        try:
            if self.is_connected():
                return True
                
            self.connection = pymysql.connect(
                host=self.host,
                user=self.user,
                password=self.password,
                database=self.database,
                port=self.port,
                autocommit=True,
                connect_timeout=self.connect_timeout,
                read_timeout=self.read_timeout,
                write_timeout=self.write_timeout,
                cursorclass=self.cursor_class  # Usa o cursor class definido
            )
            logging.info("✅ Conexão com MySQL estabelecida")
            return True
        except Error as e:
            logging.error(f"❌ Falha na conexão: {str(e)}")
            self.connection = None
            return False

    def execute(
        self, 
        query: str, 
        params: Optional[Union[tuple, Dict[str, Any]]] = None,
        return_lastrowid: bool = False
    ) -> Union[bool, int]:
        """
        Executa uma query de modificação (INSERT, UPDATE, DELETE)
        Usa cursor padrão para operações de escrita
        """
        if not self.connect():
            return False if not return_lastrowid else 0

        cursor = None
        try:
            logging.debug(f"📝 Executando query: {query} com parâmetros: {params}")
            # Para operações de escrita, usamos cursor padrão
            cursor = self.connection.cursor()
            affected_rows = cursor.execute(query, params or ())
            
            if return_lastrowid:
                lastrowid = cursor.lastrowid
                logging.debug(f"🆔 Último ID inserido: {lastrowid}")
                
                return lastrowid
                
            logging.debug(f"✅ Query executada. Linhas afetadas: {affected_rows}")
            return True
        except Error as e:
            logging.error(f"❌ Erro ao executar query: {str(e)}")
            return False if not return_lastrowid else 0
        finally:
            if cursor:
                cursor.close()

    def fetch_all(
        self, 
        query: str, 
        params: Optional[Union[tuple, Dict[str, Any]]] = None,
        return_columns: bool = False
    ) -> Union[List[Dict[str, Any]], Tuple[List[Dict[str, Any]], List[str]]]:
        """
        Executa uma query de consulta (SELECT) e retorna todos os resultados
        Opcionalmente retorna os nomes das colunas
        
        Args:
            query: Comando SQL SELECT
            params: Parâmetros para a query
            return_columns: Se True, retorna uma tupla com (resultados, colunas)
            
        Returns:
            Lista de dicionários OU tupla com (resultados, colunas)
        """
        if not self.connect():
            return ([], []) if return_columns else []

        cursor = None
        try:
            logging.debug(f"🔍 Buscando dados: {query} com parâmetros: {params}")
            cursor = self.connection.cursor()
            cursor.execute(query, params or ())
            results = cursor.fetchall()
            
            # Converte para dicionário se não for DictCursor
            if not isinstance(cursor, DictCursor):
                columns = [col[0] for col in cursor.description]
                results = [dict(zip(columns, row)) for row in results]
            
            if return_columns:
                columns = [col[0] for col in cursor.description]
                logging.debug(f"✅ {len(results)} registros encontrados, {len(columns)} colunas")
                return results, columns
            
            logging.debug(f"✅ {len(results)} registros encontrados")
            return results
        except Error as e:
            logging.error(f"❌ Erro ao buscar dados: {str(e)}")
            return ([], []) if return_columns else []
        finally:
            if cursor:
                cursor.close()

    def fetch_one(
        self, 
        query: str, 
        params: Optional[Union[tuple, Dict[str, Any]]] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Executa uma query de consulta (SELECT) e retorna um único resultado como dicionário
        """
        if not self.connect():
            return None

        cursor = None
        try:
            logging.debug(f"🔍 Buscando um registro: {query} com parâmetros: {params}")
            cursor = self.connection.cursor()
            cursor.execute(query, params or ())
            result = cursor.fetchone()
            
            # Converte para dicionário se não for DictCursor
            if result and not isinstance(cursor, DictCursor):
                columns = [col[0] for col in cursor.description]
                result = dict(zip(columns, result))
            
            logging.debug("✅ Registro encontrado" if result else "ℹ️ Nenhum registro encontrado")
            return result
        except Error as e:
            logging.error(f"❌ Erro ao buscar registro: {str(e)}")
            return None
        finally:
            if cursor:
                cursor.close()

    def fetch_scalar(
        self,
        query: str,
        params: Optional[Union[tuple, Dict[str, Any]]] = None
    ) -> Any:
        """
        Executa uma query e retorna um único valor escalar (primeira coluna do primeiro resultado)
        """
        if not self.connect():
            return None

        cursor = None
        try:
            logging.debug(f"🔢 Executando escalar: {query} com parâmetros: {params}")
            cursor = self.connection.cursor(pymysql.cursors.DictCursor)
            cursor.execute(query, params or ())
            result = cursor.fetchone()
            
            return list(result.values())[0] if result else None
        except Error as e:
            logging.error(f"❌ Erro ao buscar escalar: {str(e)}")
            return None
        finally:
            if cursor:
                cursor.close()
