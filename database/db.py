import pymysql
from pymysql.err import MySQLError as Error
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
            if self.connection and self.connection.open:
                return True
                
            self.connection = pymysql.connect(
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
        if not self.connection or not self.connection.open:
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
            cursor = self.connection.cursor(pymysql.cursors.DictCursor)  # Ajuste aqui
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
        if self.connection and self.connection.open:
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

    def executar_script_sql(self, caminho_sql):
        cursor = self.connection.cursor()

        with open(caminho_sql, 'r', encoding='utf-8') as arquivo:
            comandos_sql = arquivo.read()

        # separa em comandos individuais
        comandos = comandos_sql.split(';')

        for comando in comandos:
            comando = comando.strip()
            if comando:
                cursor.execute(comando)

        cursor.close()
        self.close()
