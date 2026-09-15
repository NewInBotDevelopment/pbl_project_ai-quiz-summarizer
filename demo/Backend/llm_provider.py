# LecturAI Multi-Provider LLM Abstraction
import os
import time
import json
import logging
from typing import List, Dict, Any, Optional
from abc import ABC, abstractmethod

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(name)s: %(message)s')
logger = logging.getLogger('LLMProvider')

class LLMProvider(ABC):
    @abstractmethod
    def generate_chat(self, messages: List[Dict[str, str]], model: Optional[str] = None,
                      temperature: float = 0.2, max_tokens: int = 4096,
                      json_mode: bool = False, response_schema: Optional[Dict[str, Any]] = None) -> str:
        pass

    @abstractmethod
    def get_models(self) -> List[str]:
        pass

class GroqProvider(LLMProvider):
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv('GROQ_API_KEY')
        self.client = None
        self.models = []
        if self.api_key:
            try:
                from groq import Groq
                self.client = Groq(api_key=self.api_key)
                # Dynamically discover active models for this API key
                try:
                    raw = self.client.models.list()
                    available = [
                        m.id for m in raw.data 
                        if not any(k in m.id.lower() for k in ('whisper', 'guard', 'vision', 'safeguard', 'tts', 'embedding'))
                    ]
                    logger.info(f'Discovered active Groq chat models: {available}')
                    priority = [
                        'openai/gpt-oss-120b',
                        'openai/gpt-oss-20b',
                        'llama-3.3-70b-versatile',
                        'llama-3.1-8b-instant',
                        'qwen/qwen3.6-27b',
                        'llama3-70b-8192',
                        'llama3-8b-8192',
                        'mixtral-8x7b-32768'
                    ]
                    ordered = [p for p in priority if p in available]
                    for m in available:
                        if m not in ordered:
                            ordered.append(m)
                    if ordered:
                        self.models = ordered
                except Exception as ex:
                    logger.warning(f'Dynamic model query failed: {ex}')
            except Exception as e:
                logger.error(f'Failed to initialize Groq client: {e}')

        if not self.models:
            primary = os.getenv('GROQ_MODEL_PRIMARY', 'openai/gpt-oss-120b')
            fallback = os.getenv('GROQ_MODEL_FALLBACK', 'openai/gpt-oss-20b')
            extras_raw = os.getenv('GROQ_MODELS_EXTRA', 'llama-3.3-70b-versatile,llama-3.1-8b-instant')
            extras = [m.strip() for m in extras_raw.split(',') if m.strip()]
            models = [primary, fallback] + [m for m in extras if m not in (primary, fallback)]
            seen = set()
            self.models = [m for m in models if not (m in seen or seen.add(m))]

        logger.info(f'GroqProvider active models cascade: {self.models}')

    def get_models(self) -> List[str]:
        return list(self.models)

    def generate_chat(self, messages: List[Dict[str, str]], model: Optional[str] = None,
                      temperature: float = 0.2, max_tokens: int = 4096,
                      json_mode: bool = False, response_schema: Optional[Dict[str, Any]] = None) -> str:
        if not self.client:
            raise RuntimeError('Groq API Key is not configured or Groq client failed to initialize.')

        models_to_try = [model] if model else self.models
        errors = []

        for m in models_to_try:
            for attempt in range(1, 3):
                try:
                    logger.info(f'Attempting completion with model: {m} (attempt {attempt}/2)')
                    kwargs = {
                        'model': m,
                        'messages': messages,
                        'temperature': temperature,
                        'max_tokens': max_tokens,
                    }
                    if json_mode or response_schema:
                        kwargs['response_format'] = {'type': 'json_object'}

                    response = self.client.chat.completions.create(**kwargs)
                    content = response.choices[0].message.content
                    if content and content.strip():
                        logger.info(f'Successfully received response from {m} ({len(content)} chars)')
                        return content
                    else:
                        raise ValueError(f'Empty response received from {m}')
                except Exception as e:
                    err_msg = str(e).lower()
                    errors.append(f'{m} (attempt {attempt}): {e}')
                    logger.warning(f'Error from {m} attempt {attempt}: {e}')
                    # If the model is decommissioned or not found, do not retry this model
                    if 'decommissioned' in err_msg or 'not found' in err_msg or 'does not exist' in err_msg:
                        logger.info(f'Model {m} is decommissioned or invalid, skipping immediately.')
                        break
                    if 'rate_limit' in err_msg or '429' in err_msg or '503' in err_msg:
                        sleep_s = attempt * 2
                        logger.info(f'Sleeping {sleep_s}s for rate limit / transient error...')
                        time.sleep(sleep_s)
                    else:
                        time.sleep(1)

        raise RuntimeError(f'All configured Groq models failed. Last error: {errors[-1] if errors else "unknown"}')

class OllamaProvider(LLMProvider):
    def __init__(self, base_url: Optional[str] = None, model: Optional[str] = None):
        self.base_url = base_url or os.getenv('OLLAMA_BASE_URL', 'http://localhost:11434/v1')
        self.model = model or os.getenv('OLLAMA_MODEL', 'llama3.2')
        try:
            from openai import OpenAI
            self.client = OpenAI(base_url=self.base_url, api_key='ollama')
        except Exception as e:
            logger.error(f'Failed to initialize Ollama client: {e}')
            self.client = None

    def get_models(self) -> List[str]:
        return [self.model]

    def generate_chat(self, messages: List[Dict[str, str]], model: Optional[str] = None,
                      temperature: float = 0.2, max_tokens: int = 4096,
                      json_mode: bool = False, response_schema: Optional[Dict[str, Any]] = None) -> str:
        if not self.client:
            raise RuntimeError('Ollama client is not initialized.')
        m = model or self.model
        kwargs = {
            'model': m,
            'messages': messages,
            'temperature': temperature,
            'max_tokens': max_tokens
        }
        if json_mode:
            kwargs['response_format'] = {'type': 'json_object'}
        resp = self.client.chat.completions.create(**kwargs)
        return resp.choices[0].message.content

def get_provider() -> LLMProvider:
    provider_type = os.getenv('LLM_PROVIDER', 'groq').lower()
    if provider_type == 'ollama':
        return OllamaProvider()
    return GroqProvider()
