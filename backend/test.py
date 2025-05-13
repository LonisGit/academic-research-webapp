import requests
api_key = "8ecc623d9f81c2dd77928cb559377c83"
#url = "https://api.elsevier.com/content/search/sciencedirect"
url = "https://pokeapi.co/api/v2/pokemon/ditto"
params = {"query": "machine learning", "apiKey": api_key}
#response = requests.get(url, params=params)
response = requests.get(url)
data = response.json()
print(data["name"])