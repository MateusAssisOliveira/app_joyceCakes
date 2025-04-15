import mysql.connector
from dotenv import load_dotenv
import os
import logging

# Configuração do logger
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class Database:
    def __init__(self, host="localhost", user="seu_usuario", password="sua_senha", database="joyce_cakes"):
        load_dotenv()
        self.host = os.getenv('DB_HOST')
        self.user = os.getenv('DB_USER')
        self.password = os.getenv('DB_PASSWORD')
        self.database = os.getenv('DB_DATABASE')
        self.conexao = None

    def conectar(self):
        logger.info("🔌 Conectando ao MySQL...")
        logger.info(f"Host: {self.host}, User: {self.user}, Database: {self.database}")
        
        if not self.host or not self.user or not self.password or not self.database:
            logger.error("❌ Erro: Variáveis de ambiente não configuradas corretamente.")
            return
        
        if self.conexao and self.conexao.is_connected():
            logger.info("🔌 Já está conectado.")
            return
        
        try:
            self.conexao = mysql.connector.connect(
                host=self.host,
                user=self.user,
                password=self.password,
                database=self.database
            )
            logger.info("✅ Conectado ao MySQL!")
        except mysql.connector.Error as e:
            logger.error(f"❌ Erro na conexão: {e}")
            self.conexao = None

    def desconectar(self):
        if self.conexao:
            self.conexao.close()
            logger.info("🔌 Conexão fechada.")

    def executar_query(self, query, valores=None):
        if not self.conexao or not self.conexao.is_connected():
            self.conectar()
        
        try:
            if self.conexao is None:
                self.conectar()
            logger.info(f"📝 Executando query: {query} com valores: {valores}")
            self.cursor = self.conexao.cursor(dictionary=True)
            self.cursor.execute(query, valores)
            self.conexao.commit()
            logger.info("✅ Query executada com sucesso.")
            return True
        except mysql.connector.Error as e:
            logger.error(f"❌ Erro ao executar query: {e}")
            return False
        finally:
            if hasattr(self, 'cursor') and self.cursor:
                self.cursor.close()

    def buscar_dados(self, query, valores=None):
        try:
            if self.conexao is None:
                self.conectar()
            cursor = self.conexao.cursor()
            logger.info(f"🔍 Buscando dados com query: {query} e valores: {valores}")
            
            if valores is None:
                cursor.execute(query)
            else:
                cursor.execute(query, valores)
            
            logger.info("✅ Dados buscados com sucesso.")
            
            if cursor.description:
                colunas = [coluna[0] for coluna in cursor.description]
                resultados = cursor.fetchall()
                return [dict(zip(colunas, resultado)) for resultado in resultados]
            else:
                logger.info("✅ Nenhum dado encontrado.")
                return []
        except mysql.connector.Error as e:
            logger.error(f"❌ Erro ao buscar dados: {e}")
            return []
        finally:
            cursor.close()
            self.desconectar()
