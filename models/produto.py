import logging
from dataclasses import dataclass, field
from typing import Optional, Union

logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@dataclass
class Produto:
    """Classe que representa um produto com validações robustas."""
    
    id: Optional[int] = field(default=None)
    nome: str = field(default='')
    descricao: str = field(default='')
    preco: float = field(default=0.0)
    quantidade: int = field(default=0)
    tipo: str = field(default='unidade')

    TIPOS_VALIDOS = {'unidade', 'kg', 'litro', 'pacote', 'caixa'}

    def __post_init__(self):
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