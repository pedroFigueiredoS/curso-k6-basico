import http from 'k6/http';
import { sleep, check } from 'k6';
import { users } from './users.js'; // Importando os usuários

// Configurações do teste
export let options = {
    stages: [
        { duration: '10s', target: 10 }, // Aumentar para 50 usuários em 10 segundos
        { duration: '5s', target: 20 }, // Manter 50 usuários por 20 segundos
        { duration: '10s', target: 5 },   // Reduzir para 0 usuários em 10 segundos
    ],
};

const urlLogin = 'https://cloudapp.animaeducacao.com.br/inspira/api/Auth?fromUlife=false';
const urlLogout = 'https://student.ulife.com.br/Logout.aspx'; // URL de logout

export default function () {
    // Escolhe um usuário aleatório do array
    const user = users[Math.floor(Math.random() * users.length)];

    // Cria o payload com os dados do usuário
    const payload = JSON.stringify({
        userLogin: user.userLogin,
        birthDate: user.birthDate,
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    // POST para login
    let response = http.post(urlLogin, payload, params);

    // Sucesso
    const isLoginSuccessful = check(response, {
        'login bem-sucedido': (r) => r.status === 200,
    });

    // Se o login foi bem-sucedido, extrai e carrega o authUlife
    if (isLoginSuccessful) {
        const responseBody = JSON.parse(response.body);
        
        // Acessa o authUlife dentro do objeto data
        const authUlife = responseBody.data.authUlife;

        if (authUlife) {
            console.log(`authUlife: ${authUlife}`);

            // Carrega a página do authUlife
            const authResponse = http.get(authUlife);

            // Verifica se o carregamento da página foi bem-sucedido
            check(authResponse, {
                'página carregada com sucesso': (r) => r.status === 200,
            });

            // Realiza o logout acessando a URL de logout
            const logoutResponse = http.get(urlLogout);
            check(logoutResponse, {
                'logout bem-sucedido': (r) => r.status === 200,
            });

        } else {
            console.error('authUlife não encontrado na resposta.');
        }
    } else {
        // Erro
        console.error(`Erro no login: ${response.status}`);
        console.error(`Usuário com erro: ${user.userLogin}, Data de Nascimento: ${user.birthDate}`);
        console.error(`Resposta: ${response.body}`);
    }

    // Aguarda um pouco antes de realizar a próxima requisição
    sleep(1);
}
