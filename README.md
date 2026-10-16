# Agenda Acadêmica — Anhanguera

## Sobre o projeto

O Agenda Acadêmica é uma aplicação web desenvolvida como projeto acadêmico do curso de Análise e Desenvolvimento de Sistemas.

O sistema tem como objetivo facilitar a consulta e a organização dos horários das aulas, permitindo que alunos visualizem sua grade horária e que coordenadores acessem as funcionalidades administrativas disponíveis na aplicação.

## Funcionalidades

* Autenticação de usuários.
* Acesso diferenciado para alunos e coordenadores.
* Visualização da grade horária acadêmica.
* Consulta e filtragem de informações.
* Organização dos horários das aulas.
* Consulta de informações relacionadas às aulas de laboratório.

As funcionalidades descritas devem corresponder à versão efetivamente implementada no projeto.

## Tecnologias utilizadas

**Front-end**

* HTML5
* CSS3
* JavaScript

**Back-end**

* Node.js
* Express.js
* API REST

**Banco de dados**

* MySQL

## Estrutura do projeto

A aplicação está organizada em três componentes principais:

* **Front-end:** responsável pela interface e pela interação com os usuários.
* **Back-end:** responsável pelo processamento das requisições, pelas regras da aplicação e pela comunicação com o banco de dados.
* **Banco de dados:** responsável pelo armazenamento das informações utilizadas pelo sistema.

## Como executar o projeto

### Pré-requisitos

Para executar a aplicação localmente, é necessário ter instalado:

* Node.js
* MySQL Server
* Git

### 1. Clonar o repositório

```bash
git clone URL_DO_REPOSITORIO
```

Acesse a pasta do projeto:

```bash
cd NOME_DA_PASTA
```

### 2. Configurar o banco de dados

Configure o servidor MySQL e crie o banco de dados utilizado pela aplicação.

O banco de dados do projeto é identificado como `grade_horaria`.

Verifique os arquivos do repositório para identificar o script SQL necessário para criar as tabelas e preparar a estrutura do banco de dados.

### 3. Instalar as dependências

Acesse a pasta do back-end que contém o arquivo `package.json` e execute:

```bash
npm install
```

Configure as credenciais de acesso ao banco de dados e as demais variáveis de ambiente necessárias para o funcionamento da aplicação.

### 4. Iniciar o servidor

Execute o comando de inicialização definido no arquivo `package.json` do back-end.

Na configuração local conhecida, a API utiliza a porta `3000`.

### 5. Acessar a aplicação

Inicie o front-end utilizando o servidor de desenvolvimento configurado no projeto ou abra a página inicial no navegador, conforme a estrutura da aplicação.

Para utilizar as funcionalidades que dependem da API, o back-end e o banco de dados devem estar configurados e em execução.

## Objetivo acadêmico

O projeto tem como finalidade aplicar conhecimentos adquiridos durante o curso de Análise e Desenvolvimento de Sistemas, abrangendo desenvolvimento web, integração entre front-end e back-end, construção de APIs e utilização de bancos de dados relacionais.

## Autor

Projeto acadêmico desenvolvido no curso de Análise e Desenvolvimento de Sistemas.
