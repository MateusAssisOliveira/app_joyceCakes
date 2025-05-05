<<<<<<< HEAD
import logging
from dataclasses import dataclass, field
from typing import Optional, Union

=======
from decimal import Decimal
import logging
from dataclasses import dataclass, field

# Configuração básica do logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

from decimal import Decimal
import logging
from dataclasses import dataclass, field
from typing import Optional

# Configuração básica do logging
>>>>>>> f08f16e695d0881e7c5fcdaa28b14b86b2e789f1
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@dataclass
class Produto:
<<<<<<< HEAD
    """Classe que representa um produto com validações robustas."""
    
    id: Optional[int] = field(default=None)
    nome: str = field(default='')
    descricao: str = field(default='')
    preco: float = field(default=0.0)
    quantidade: int = field(default=0)
    tipo: str = field(default='unidade')
=======
    """Classe que representa um produto com validações robustas.
    
    Atributos:
        id: Identificador único (opcional)
        nome: Nome do produto (não pode ser vazio)
        descricao: Descrição detalhada
        preco: Preço unitário (não negativo)
        quantidade: Quantidade em estoque (inteiro não negativo)
        tipo: Tipo de unidade (deve estar em TIPOS_VALIDOS)
    """
    
    id: Optional[int] = field(default=None)
    nome: str = field(default='', repr=False)
    descricao: str = field(default='', repr=False)
    preco: float = field(default=0.0, repr=False)
    quantidade: int = field(default=0, repr=False)
    tipo: str = field(default='unidade', repr=False)
>>>>>>> f08f16e695d0881e7c5fcdaa28b14b86b2e789f1

    TIPOS_VALIDOS = {'unidade', 'kg', 'litro', 'pacote', 'caixa'}

    def __post_init__(self):
<<<<<<< HEAD
        """Validação pós-inicialização com tratamento de tipos"""
        self._validar_e_converter_tipos()

    def _validar_e_converter_tipos(self):
        """Conversão segura de tipos e validações"""
        # Conversão do ID
        if self.id is not None:
            self.id = self._converter_id(self.id)
            
        # Conversão do preço
        self.preco = self._converter_preco(self.preco)
        
        # Conversão da quantidade
        self.quantidade = self._converter_quantidade(self.quantidade)
        
        # Validações finais
        self._validar_nome()
        self._validar_tipo()

    def _converter_id(self, valor: Union[int, str, None]) -> Optional[int]:
        """Converte ID para inteiro de forma segura"""
        if valor is None:
            return None
        if isinstance(valor, str) and valor.strip() == '':
            return None
        try:
            return int(valor)
        except (ValueError, TypeError) as e:
            logger.error(f"ID inválido: {valor}")
            raise ValueError("ID deve ser um número inteiro ou vazio") from e

    def _converter_preco(self, valor: Union[str, float, int]) -> float:
        """Converte preço para float de forma segura"""
        if isinstance(valor, str):
            valor = valor.replace(',', '.').strip()
            try:
                return float(valor)
            except ValueError as e:
                logger.error(f"Preço inválido: {valor}")
                raise ValueError("Preço deve ser um número válido (ex: 10.99)") from e
        return float(valor)

    def _converter_quantidade(self, valor: Union[str, int]) -> int:
        """Converte quantidade para inteiro de forma segura"""
        if isinstance(valor, str):
            try:
                return int(valor.strip())
            except ValueError as e:
                logger.error(f"Quantidade inválida: {valor}")
                raise ValueError("Quantidade deve ser um número inteiro") from e
        return int(valor)

    def _validar_nome(self):
        """Validação do nome com tratamento de espaços"""
        if not isinstance(self.nome, str) or not self.nome.strip():
            logger.error("Nome não pode ser vazio")
            raise ValueError("Nome não pode ser vazio")
        self.nome = self.nome.strip()

    def _validar_tipo(self):
        """Validação do tipo com normalização"""
        tipo = self.tipo.strip().lower()
        if tipo not in self.TIPOS_VALIDOS:
            raise ValueError(f"Tipo inválido. Valores permitidos: {', '.join(self.TIPOS_VALIDOS)}")
        self.tipo = tipo
        
    def __str__(self):
        return (f"Produto(id={self.id}, nome='{self.nome}', descricao='{self.descricao}', "
                f"preco={self.preco:.2f}, quantidade={self.quantidade}, tipo='{self.tipo}')")
=======
        """Dispara validações apenas para atributos fornecidos"""
        logger.debug("Validando atributos via __post_init__")
        
        # Valida apenas os atributos que foram fornecidos
        for attr in ['nome', 'descricao', 'preco', 'quantidade', 'tipo']:
            if hasattr(self, attr):  # Verifica se o atributo foi inicializado
                setattr(self, attr, getattr(self, attr))
        
        # Validação especial para id (só valida se foi fornecido)
        if hasattr(self, 'id'):
            self.id = self.id

    @property
    def id(self) -> Optional[int]:
        """Retorna o ID do produto."""
        return self._id

    @id.setter
    def id(self, valor: Optional[int]):
        """Define o ID com validação."""
        logger.debug(f"Setando ID com valor: {valor}")
        if valor is not None:
            if isinstance(valor, str) and valor.isdigit():
                valor = int(valor)
            elif not isinstance(valor, int):
                logger.error("ID deve ser um inteiro ou None.")
                raise TypeError("ID deve ser um inteiro ou None.")
        self._id = valor
        logger.info(f"ID setado com sucesso: {self._id}")

    # Nome
    @property
    def nome(self):
        return self._nome

    @nome.setter
    def nome(self, valor):
        logger.debug(f"Setando nome com valor: {valor}")
        if not isinstance(valor, str):
            logger.error("Nome deve ser uma string.")
            raise TypeError("Nome deve ser uma string.")
        if not valor.strip():
            logger.error("Nome não pode ser vazio.")
            raise ValueError("Nome não pode ser vazio.")
        self._nome = valor.strip()
        logger.info(f"Nome setado com sucesso: {self._nome}")

    # Descrição
    @property
    def descricao(self):
        return self._descricao

    @descricao.setter
    def descricao(self, valor):
        logger.debug(f"Setando descrição com valor: {valor}")
        if not isinstance(valor, str):
            logger.error("Descrição deve ser uma string.")
            raise TypeError("Descrição deve ser uma string.")
        self._descricao = valor.strip()
        logger.info(f"Descrição setada com sucesso: {self._descricao}")

    # Preço
    @property
    def preco(self):
        return self._preco

    @preco.setter
    def preco(self, valor):
        logger.debug(f"Setando preço com valor: {valor}")
        if isinstance(valor, Decimal):
            valor = float(valor)
        if not isinstance(valor, (int, float)):
            logger.error("Preço deve ser um número.")
            raise TypeError("Preço deve ser um número.")
        if valor < 0:
            logger.error("Preço não pode ser negativo.")
            raise ValueError("Preço não pode ser negativo.")
        self._preco = float(valor)
        logger.info(f"Preço setado com sucesso: {self._preco}")

    # Quantidade
    @property
    def quantidade(self):
        return self._quantidade

    @quantidade.setter
    def quantidade(self, valor):
        logger.debug(f"Setando quantidade com valor: {valor}")
        if not isinstance(valor, int):
            logger.error("Quantidade deve ser um inteiro.")
            raise TypeError("Quantidade deve ser um inteiro.")
        if valor < 0:
            logger.error("Quantidade não pode ser negativa.")
            raise ValueError("Quantidade não pode ser negativa.")
        self._quantidade = valor
        logger.info(f"Quantidade setada com sucesso: {self._quantidade}")

    # Tipo
    @property
    def tipo(self):
        return self._tipo

    @tipo.setter
    def tipo(self, valor):
        logger.debug(f"Setando tipo com valor: {valor}")
        if not isinstance(valor, str):
            logger.error("Tipo deve ser uma string.")
            raise TypeError("Tipo deve ser uma string.")
        if valor.lower() not in self.TIPOS_VALIDOS:
            tipos_validos = ', '.join(sorted(self.TIPOS_VALIDOS))
            logger.error(f"Tipo inválido. Tipos válidos: {tipos_validos}.")
            raise ValueError(f"Tipo inválido. Tipos válidos: {tipos_validos}.")
        self._tipo = valor.lower()
        logger.info(f"Tipo setado com sucesso: {self._tipo}")
    
    def to_dict(self):
        """Retorna os dados do produto como dicionário."""
        return {
            'id': self.id,
            'nome': self.nome,
            'descricao': self.descricao,
            'preco': self.preco,
            'quantidade': self.quantidade,
            'tipo': self.tipo
        }

    def __str__(self):
        """Retorna uma representação em string amigável do produto."""
        return (f"Produto(id={self.id}, nome='{self.nome}', descricao='{self.descricao}', "
                f"preco={self.preco:.2f}, quantidade={self.quantidade}, tipo='{self.tipo}')")
>>>>>>> f08f16e695d0881e7c5fcdaa28b14b86b2e789f1
