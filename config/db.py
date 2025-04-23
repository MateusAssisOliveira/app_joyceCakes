import mysql.connector
from mysql.connector import Error
from dotenv import load_dotenv
import os
import logging
from typing import Optional, List, Dict, Union

# Configuração do logger
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class Database:
    def __init__(self):
        load_dotenv()
        self.host = os.getenv('DB_HOST', 'localhost')
        self.user = os.getenv('DB_USER', 'root')
        self.password = os.getenv('DB_PASSWORD', '')
        self.database = os.getenv('DB_DATABASE', 'joyce_cakes')
        self.connection = None
        self._validate_credentials()

    def _validate_credentials(self):
        """Valida se as credenciais mínimas estão configuradas"""
        if not all([self.host, self.user, self.database]):
            logger.error("❌ Configuração de banco de dados incompleta")
            raise ValueError("Credenciais do banco de dados incompletas")

    def _connect(self) -> bool:
        """Estabelece conexão com o banco de dados"""
        try:
            if self.connection and self.connection.is_connected():
                return True
                
            self.connection = mysql.connector.connect(
                host=self.host,
                user=self.user,
                password=self.password,
                database=self.database,
                autocommit=True
            )
            logger.info("✅ Conexão com MySQL estabelecida")
            return True
        except Error as e:
            logger.error(f"❌ Falha na conexão: {e}")
            self.connection = None
            return False

    def _ensure_connection(self) -> bool:
        """Garante que há uma conexão ativa"""
        if not self.connection or not self.connection.is_connected():
            return self._connect()
        return True

    def execute_query(self, query: str, params: Optional[tuple] = None) -> bool:
        """
        Executa uma query de modificação (INSERT, UPDATE, DELETE)
        Retorna True se bem sucedido
        """
        cursor = None
        try:
            if not self._ensure_connection():
                return False

            logger.info(f"📝 Executando query: {query} com parâmetros: {params}")
            cursor = self.connection.cursor()
            cursor.execute(query, params or ())
            logger.info("✅ Query executada com sucesso")
            return True
        except Error as e:
            logger.error(f"❌ Erro ao executar query: {e}")
            return False
        finally:
            if cursor:
                cursor.close()

    def fetch_data(self, query: str, params: Optional[tuple] = None) -> List[Dict]:
        """
        Executa uma query de consulta (SELECT)
        Retorna lista de dicionários com os resultados
        """
        cursor = None
        try:
            if not self._ensure_connection():
                return []

            logger.info(f"🔍 Buscando dados: {query} com parâmetros: {params}")
            cursor = self.connection.cursor(dictionary=True)
            cursor.execute(query, params or ())
            results = cursor.fetchall()
            logger.info(f"✅ {len(results)} registros encontrados")
            return results
        except Error as e:
            logger.error(f"❌ Erro ao buscar dados: {e}")
            return []
        finally:
            if cursor:
                cursor.close()

    def close(self):
        """Fecha a conexão com o banco de dados"""
        if self.connection and self.connection.is_connected():
            self.connection.close()
            logger.info("🔌 Conexão encerrada")
        self.connection = None

    def __enter__(self):
        """Suporte para context manager (with statement)"""
        self._ensure_connection()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Garante que a conexão é fechada ao sair do contexto"""
        self.close()