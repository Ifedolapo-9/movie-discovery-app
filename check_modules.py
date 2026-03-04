import weaviate
from weaviate.auth import AuthApiKey
import json, os
from dotenv import load_dotenv

load_dotenv()

url = os.getenv("WEAVIATE_URL")
api_key = os.getenv("WEAVIATE_API_KEY")

client = weaviate.connect_to_weaviate_cloud(
    cluster_url=url,
    auth_credentials=AuthApiKey(api_key),
    skip_init_checks=True,
)

try:
    meta = client.get_meta()
    modules = meta.get("modules", {})
    print("Enabled modules:")
    print(json.dumps(modules, indent=2))
finally:
    client.close()
