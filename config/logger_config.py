# config/logger_config.py
import logging

def configurar_logger(nome=__name__):
    logger = logging.getLogger(nome)
    if not logger.handlers:  # Garante que não haja handlers duplicados
        handler = logging.StreamHandler()
        formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)
    return logger
