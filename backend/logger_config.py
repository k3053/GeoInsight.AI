import logging

# Configure and create a shared logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

if not logger.handlers:  # Avoid adding duplicate handlers
    handler = logging.StreamHandler()
    formatter = logging.Formatter('%(asctime)s - %(filename)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)
    logger.addHandler(handler)
