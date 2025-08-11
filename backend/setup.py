from setuptools import setup, find_packages 

setup(
    name="GeoInsight.AI",
    author="Meet Jariwala",
    version="0.1",
    packages=find_packages(),
    python_requires=">=3.8",
    install_requires=[
        "structlog",
    ],
)