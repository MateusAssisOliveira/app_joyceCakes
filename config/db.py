import mysql.connector
from dotenv import load_dotenv
import os

class Database:
    def __init__(self, host="localhost", user="seu_usuario", password="sua_senha", database="joyce_cakes"):
        """Inicializa a conexão com o banco de dados."""
        load_dotenv()
        self.host = os.getenv('DB_HOST')
        self.user = os.getenv('DB_USER')
        self.password = os.getenv('DB_PASSWORD')
        self.database = os.getenv('DB_DATABASE')
        self.conexao = None

    def conectar(self):
        """Cria a conexão com o banco de dados."""
        
        print("🔌 Conectando ao MySQL...")
        print(f"Host: {self.host}, User: {self.user}, Database: {self.database}")
        if not self.host or not self.user or not self.password or not self.database:
            print("❌ Erro: Variáveis de ambiente não configuradas corretamente.")
            return
        if self.conexao and self.conexao.is_connected():
            print("🔌 Já está conectado.")
            return
        
        try:
            self.conexao = mysql.connector.connect(
                host=self.host,
                user=self.user,
                password=self.password,
                database=self.database
            )
            print("✅ Conectado ao MySQL!")
        except mysql.connector.Error as e:
            print(f"❌ Erro na conexão: {e}")
            self.conexao = None

    def desconectar(self):
        """Fecha a conexão com o banco de dados."""
        if self.conexao:
            self.conexao.close()
            print("🔌 Conexão fechada.")

    def executar_query(self, query, valores=None):
        """Executa um comando SQL (INSERT, UPDATE, DELETE)."""
        
        if not self.conexao or not self.conexao.is_connected():
            self.conectar()  # Conecta apenas se não estiver conectado
        
        try:
            if self.conexao is None:
                self.conectar()
            print(f"Executando query: {query} com valores: {valores}")
            self.cursor = self.conexao.cursor( dictionary=True)
            self.cursor.execute(query, valores)
            self.conexao.commit()
            print("✅ Query executada com sucesso.")
            return True
        except mysql.connector.Error as e:
            print(f"❌ Erro ao executar query: {e}")
            return False
        finally:
            self.cursor.close()

    def buscar_dados(self, query, valores=None):
        """Executa um SELECT e retorna os resultados."""
        try:
            if self.conexao is None:
                self.conectar()
            cursor = self.conexao.cursor()
            print(f"Buscando dados com query: {query} e valores: {valores}")
            if valores is None:
                cursor.execute(query)
            else:
                cursor.execute(query, valores)
            print("✅ Dados buscados com sucesso.")
            # Retorna os resultados como uma lista de dicionários
            # onde cada dicionário representa uma linha do resultado
            # e as chaves são os nomes das colunas
            # Se não houver resultados, retorna uma lista vazia
            if cursor.description:
                colunas = [coluna[0] for coluna in cursor.description]
                resultados = cursor.fetchall()
                return [dict(zip(colunas, resultado)) for resultado in resultados]
            else:
                # Se não houver resultados, retorna uma lista vazia
                print("✅ Nenhum dado encontrado.")
                return []
        except mysql.connector.Error as e:
            print(f"❌ Erro ao buscar dados: {e}")
            return []
        finally:
            cursor.close()
            self.desconectar()