import google.generativeai as genai
import logging

class LLMAgent:
    def __init__(self):
        # Obtain your free key from https://aistudio.google.com/app/apikey (starts with AIzaSy...)
        self.api_key = ""
        
        try:
            if self.api_key and self.api_key != "":
                genai.configure(api_key=self.api_key)
                self.model = genai.GenerativeModel('gemini-1.5-flash')
            else:
                self.model = None
        except Exception as e:
            logging.error(f"Failed to initialize LLM: {e}")
            self.model = None

    def get_route_insight(self, origin, destination, cargo_type):
        if not self.model or not self.api_key or self.api_key == "AQ.":
            return (
                "SYSTEM NOTICE: Valid LLM API Key missing. "
                "Please add your Gemini API key (AIzaSy...) to llm_agent.py."
            )

        prompt = (
            f"You are an expert maritime logistics AI. The user is planning to ship "
            f"'{cargo_type}' from '{origin}' to '{destination}'. "
            f"In exactly 2 concise sentences, provide a highly accurate, professional maritime "
            f"insight about this specific trade lane. Mention potential geographical chokepoints, "
            f"typical weather risks, or strategic advice for this exact cargo."
        )

        try:
            response = self.model.generate_content(
                prompt,
                request_options={"timeout": 4.0}
            )
            return response.text.strip()
        except Exception as e:
            logging.warning(f"LLM Generation Error: {e}")
            return "Real-time AI connection timeout. Bypassing live insight to maintain system performance."