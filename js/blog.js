import { collection, db, getDocs } from "../firebase-config.js";
        const postsGrid = document.getElementById('postsGrid');
        const filters = document.getElementById('filters');
        let posts = [];
        let filtroActual = 'todos';

        function renderFilters() {
            const categorias = ['todos', ...new Set(posts.map(post => post.categoria).filter(Boolean))];
            filters.replaceChildren();
            categorias.forEach(categoria => {
                const button = document.createElement('button');
                button.type = 'button';
                button.textContent = categoria === 'todos' ? 'Todos' : categoria;
                button.className = categoria === filtroActual ? 'active' : '';
                button.addEventListener('click', () => {
                    filtroActual = categoria;
                    renderFilters();
                    renderPosts();
                });
                filters.appendChild(button);
            });
        }

        function renderPosts() {
            const visibles = filtroActual === 'todos' ? posts : posts.filter(post => post.categoria === filtroActual);
            postsGrid.replaceChildren();
            if (visibles.length === 0) {
                const empty = document.createElement('p');
                empty.className = 'empty';
                empty.textContent = 'Aún no hay artículos publicados.';
                postsGrid.appendChild(empty);
                return;
            }
            visibles.forEach(post => {
                const article = document.createElement('article');
                const category = document.createElement('span');
                category.className = 'category';
                category.textContent = post.categoria || 'General';
                const title = document.createElement('h2');
                title.textContent = post.titulo || 'Sin título';
                const excerpt = document.createElement('p');
                excerpt.textContent = (post.resumen || post.contenido || '').substring(0, 220);
                const date = document.createElement('span');
                date.className = 'date';
                date.textContent = post.fechaPublicacion ? new Date(post.fechaPublicacion).toLocaleDateString('es-MX') : '';
                article.append(category, title, excerpt, date);
                postsGrid.appendChild(article);
            });
        }

        try {
            const snapshot = await getDocs(collection(db, 'posts'));
            posts = snapshot.docs.map(post => ({ id: post.id, ...post.data() }));
            posts.sort((a, b) => new Date(b.fechaPublicacion || 0) - new Date(a.fechaPublicacion || 0));
            renderFilters();
            renderPosts();
        } catch (error) {
            postsGrid.replaceChildren();
            const message = document.createElement('p');
            message.className = 'empty';
            message.textContent = 'No fue posible cargar los artículos en este momento.';
            postsGrid.appendChild(message);
        }
