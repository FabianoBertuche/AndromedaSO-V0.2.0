import json

class DocumentParser:
    async def parse(self, content: bytes, mime_type: str) -> str:
        """Extracts plain text from various file formats."""
        if mime_type == "text/plain" or mime_type == "text/markdown":
            return content.decode("utf-8")
        
        if mime_type == "application/json":
            data = json.loads(content)
            return json.dumps(data, indent=2)

        # TODO: Implement PDF and DOCX parsing
        # For MVP08, we focus on md, txt, json
        return content.decode("utf-8", errors="ignore")
