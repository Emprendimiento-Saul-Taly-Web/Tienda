// ==========================================
// VARIABLES Y ESTADO DE AUTH
// (Usamos las declaradas en firebase-config.js)
// ==========================================
let esNuevoRegistro = false;
let usuarioActualID = null;

// ==========================================
// CONTROL DE MODALES Y VISTAS
// ==========================================
function toggleAuthModal(show) {
    const modal = document.getElementById('auth-modal');
    if (modal) {
        modal.style.display = show ? 'flex' : 'none';
    }
}

function gestionarSesionBottom() {
    if (auth.currentUser) {
        logoutClient();
    } else {
        toggleAuthModal(true);
    }
}

function mostrarFormularioRecuperar(mostrar) {
    document.getElementById('auth-main-form').style.display = mostrar ? 'none' : 'block';
    document.getElementById('auth-reset-form').style.display = mostrar ? 'block' : 'none';
    document.getElementById('auth-title').innerText = mostrar ? '🔒 Recuperar Contraseña' : '🔑 Iniciar Sesión';
}

// ==========================================
// OBSERVADOR DE ESTADO DE AUTENTICACIÓN
// ==========================================
auth.onAuthStateChanged(user => {
    const btnOpenAuth = document.getElementById('btn-open-auth');
    const userActions = document.getElementById('user-actions');
    const userInfo = document.getElementById('user-info');

    if (user) {
        const esGoogle = user.providerData.some(p => p.providerId === 'google.com');

        // Validar correo si no entra por Google
        if (!esGoogle && !user.emailVerified) {
            auth.signOut();
            alert("⚠️ Debes verificar tu correo electrónico para acceder. Revisa tu bandeja de entrada o spam.");
            usuarioActualID = null;
            if(btnOpenAuth) btnOpenAuth.style.display = 'block';
            if(userActions) userActions.style.display = 'none';
            if(userInfo) userInfo.style.display = 'none';
            return;
        }

        usuarioActualID = user.uid;
        if(btnOpenAuth) btnOpenAuth.style.display = 'none';
        if(userActions) userActions.style.display = 'flex';
        if(userInfo) userInfo.style.display = 'flex';

        procesarUsuarioGoogle(user);
        toggleAuthModal(false);
    } else {
        usuarioActualID = null;
        if(btnOpenAuth) btnOpenAuth.style.display = 'block';
        if(userActions) userActions.style.display = 'none';
        if(userInfo) userInfo.style.display = 'none';
    }
});

// ==========================================
// INICIO DE SESIÓN Y REGISTRO
// ==========================================
function loginWithEmail() {
    const email = document.getElementById('auth-email').value.trim();
    const pass = document.getElementById('auth-password').value;

    if (!email || !pass) {
        return alert("Por favor ingresa tu correo y contraseña.");
    }

    auth.signInWithEmailAndPassword(email, pass)
        .then(() => {
            toggleAuthModal(false);
        })
        .catch(err => alert("Error al iniciar sesión: " + err.message));
}

function registerWithEmail() {
    toggleAuthModal(false);
    esNuevoRegistro = true;

    const passGroup = document.getElementById('perfilPasswordGroup');
    if (passGroup) passGroup.style.display = 'block';

    const formPerfil = document.getElementById('formPerfil');
    if (formPerfil) formPerfil.reset();

    if (typeof abrirModalPerfil === 'function') abrirModalPerfil(false);
}

function loginWithGoogle() {
    if (window.AndroidNative && window.AndroidNative.lanzarGoogleLoginNativo) {
        window.AndroidNative.lanzarGoogleLoginNativo();
        return;
    }

    provider = googleProvider || new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({
        'client_id': '1074941413246-sa4pmj75ng3q10pehpq6p6tdc6qoottp.apps.googleusercontent.com',
        'prompt': 'select_account'
    });

    auth.signInWithPopup(provider)
        .then((result) => {
            procesarUsuarioGoogle(result.user);
        })
        .catch((error) => {
            console.error("Error en Google Auth:", error);
            alert("❌ Error al iniciar sesión con Google: " + error.message);
        });
}

async function procesarUsuarioGoogle(user) {
    if (!user || !user.uid) return;
    usuarioActualID = user.uid;

    try {
        let refUsuario = db.ref('usuarios/' + user.uid);
        let snapshot = await refUsuario.once('value');
        let userData = snapshot.val();

        if (!userData && user.email) {
            const emailNormalizado = user.email.toLowerCase();
            const snapshotTodos = await db.ref('usuarios').once('value');
            const todosLosUsuarios = snapshotTodos.val() || {};

            for (let uidExistente in todosLosUsuarios) {
                const u = todosLosUsuarios[uidExistente];
                if (u.correo && u.correo.toLowerCase() === emailNormalizado) {
                    userData = u;
                    await refUsuario.set(userData);
                    break;
                }
            }
        }

        const tieneCedula = userData && (userData.cedula || userData.cedulaNum);
        const tieneCelular = userData && userData.celular;
        const aceptoTerminos = userData && (userData.aceptoTerminosLegales || userData.aceptoTerminos);

        const perfilIncompleto = !userData || !tieneCedula || !tieneCelular || !aceptoTerminos;

        if (perfilIncompleto) {
            esNuevoRegistro = true;
            toggleAuthModal(false);

            if (typeof abrirModalPerfil === 'function') abrirModalPerfil(true, true);

            if (document.getElementById('perfilNombre')) {
                document.getElementById('perfilNombre').value = (userData && userData.nombre) ? userData.nombre : (user.displayName || '');
            }
            if (document.getElementById('perfilCorreo')) {
                document.getElementById('perfilCorreo').value = user.email ? user.email.toLowerCase() : '';
            }
            if (document.getElementById('perfilCedulaNum')) {
                if (userData && userData.cedula && userData.cedula.includes('-')) {
                    document.getElementById('perfilCedulaNum').value = userData.cedula.split('-')[1] || '';
                } else {
                    document.getElementById('perfilCedulaNum').value = (userData && userData.cedulaNum) ? userData.cedulaNum : '';
                }
            }
            if (document.getElementById('perfilCelular')) {
                document.getElementById('perfilCelular').value = (userData && userData.celular) ? userData.celular : '';
            }
        } else {
            esNuevoRegistro = false;
            const btnCerrar = document.getElementById('btnCerrarModalPerfil');
            if (btnCerrar) btnCerrar.style.display = 'inline-block';

            if (typeof cerrarModalPerfil === 'function') cerrarModalPerfil();
            toggleAuthModal(false);
        }
    } catch (err) {
        console.error("Error al consultar usuario en la base de datos:", err);
    }
}

// ==========================================
// GUARDAR PERFIL
// ==========================================
async function guardarDatosPerfil(event) {
    if (event) event.preventDefault();

    const nombre = document.getElementById('perfilNombre').value.trim();
    const tipoCedula = document.getElementById('perfilTipoCedula').value;
    const numCedula = document.getElementById('perfilCedulaNum').value.trim();
    const cedulaCompleta = tipoCedula + numCedula;

    const inputCorreo = document.getElementById('perfilCorreo') || document.getElementById('auth-email');
    const correo = inputCorreo ? inputCorreo.value.trim() : (auth.currentUser ? auth.currentUser.email : "");

    const celular = document.getElementById('perfilCelular').value.trim();
    const passwordInput = document.getElementById('perfilPassword');
    const password = passwordInput ? passwordInput.value : "";
    const chkTerminos = document.getElementById('perfilAceptoTerminos');

    if (!nombre || !numCedula || !correo || !celular) {
        alert("⚠️ Por favor completa todos los campos obligatorios.");
        return;
    }

    if (chkTerminos && chkTerminos.offsetParent !== null && !chkTerminos.checked) {
        alert("⚠️ Debes aceptar los Términos y Condiciones para continuar.");
        return;
    }

    try {
        const snapshotUsuarios = await db.ref('usuarios').once('value');
        const usuarios = snapshotUsuarios.val() || {};
        const currentUid = auth.currentUser ? auth.currentUser.uid : null;

        for (let uid in usuarios) {
            if (currentUid && uid === currentUid) continue;
            const u = usuarios[uid];
            if (u.cedula && u.cedula.trim().toLowerCase() === cedulaCompleta.toLowerCase()) {
                alert("⚠️ La cédula ingresada ya se encuentra registrada.");
                return;
            }
            if (u.celular && u.celular.trim() === celular) {
                alert("⚠️ El número de teléfono ingresado ya se encuentra registrado.");
                return;
            }
        }
    } catch (error) {
        console.error("Error al validar datos duplicados:", error);
        alert("❌ Error de conexión al validar datos.");
        return;
    }

    if (esNuevoRegistro && !auth.currentUser) {
        if (!password || password.length < 6) {
            alert("⚠️ La contraseña debe tener al menos 6 caracteres.");
            return;
        }

        try {
            const userCredential = await auth.createUserWithEmailAndPassword(correo, password);
            const user = userCredential.user;

            await db.ref('usuarios/' + user.uid).set({
                nombre: nombre,
                correo: correo.toLowerCase(),
                cedula: cedulaCompleta,
                celular: celular,
                aceptoTerminosLegales: true,
                fechaRegistro: new Date().toISOString()
            });

            await user.sendEmailVerification();
            alert("✅ Registro exitoso. Se ha enviado un correo de verificación.");
            esNuevoRegistro = false;
            if (typeof cerrarModalPerfil === 'function') cerrarModalPerfil();
            auth.signOut();
        } catch (error) {
            console.error("Error en registro:", error);
            alert("❌ Error al crear cuenta: " + error.message);
        }
    } else if (auth.currentUser) {
        try {
            const providerId = auth.currentUser.providerData[0]?.providerId;
            const esUsuarioGoogle = providerId === 'google.com';

            if (esNuevoRegistro && !esUsuarioGoogle) {
                if (!password || password.length < 6) {
                    alert("⚠️ Ingresa una contraseña de al menos 6 caracteres.");
                    return;
                }
                await auth.currentUser.updatePassword(password);
            }

            const datosUsuario = {
                nombre: nombre,
                correo: correo.toLowerCase(),
                cedula: cedulaCompleta,
                celular: celular,
                aceptoTerminosLegales: true
            };

            if (esNuevoRegistro) {
                datosUsuario.fechaRegistro = new Date().toISOString();
                await db.ref('usuarios/' + auth.currentUser.uid).set(datosUsuario);
            } else {
                await db.ref('usuarios/' + auth.currentUser.uid).update(datosUsuario);
            }

            alert("✅ Datos guardados con éxito.");
            esNuevoRegistro = false;
            if (typeof cerrarModalPerfil === 'function') cerrarModalPerfil();
        } catch (error) {
            console.error("Error al actualizar perfil:", error);
            alert("❌ Ocurrió un error al guardar los datos: " + error.message);
        }
    }
}

// ==========================================
// RESTABLECER CONTRASEÑA Y SOPORTE
// ==========================================
function enviarCorreoRecuperacion() {
    const email = document.getElementById('reset-email-input').value.trim();

    if (!email) {
        return alert("Por favor, ingresa tu correo electrónico.");
    }

    auth.sendPasswordResetEmail(email)
        .then(() => {
            alert("✅ Se ha enviado un correo electrónico a " + email + " con las instrucciones.");
            mostrarFormularioRecuperar(false);
            toggleAuthModal(false);
        })
        .catch((error) => {
            if (error.code === 'auth/user-not-found') {
                alert("❌ No existe ninguna cuenta registrada con este correo.");
            } else {
                alert("❌ Error al enviar el correo: " + error.message);
            }
        });
}

function contactarSoporteWS() {
    const emailInput = document.getElementById('auth-email').value.trim();
    let mensaje = "*🆘 SOLICITUD DE SOPORTE - RESTABLECER CONTRASEÑA*%0A";
    mensaje += "*Emprendimiento Saul Taly*%0A----------------------------------------------------%0A";
    mensaje += "_Hola, olvidé mi contraseña y necesito ayuda para recuperar el acceso._%0A%0A";

    if (emailInput) {
        mensaje += `📧 *Correo / Usuario asociado:* ${emailInput}%0A`;
    }

    window.location.href = "https://wa.me/584126950652?text=" + mensaje;
}

// ==========================================
// MÉTODOS Y CALLBACKS ADICIONALES
// ==========================================
function procesarLoginNativoGoogle(idToken) {
    const credential = firebase.auth.GoogleAuthProvider.credential(idToken);
    auth.signInWithCredential(credential)
        .then(() => {
            toggleAuthModal(false);
        })
        .catch((error) => {
            alert("❌ Error de autenticación: " + error.message);
        });
}

function logoutClient() {
    if (confirm("¿Estás seguro de que deseas cerrar sesión?")) {
        auth.signOut()
            .then(() => {
                cart = {};
                if (typeof render === 'function') render();
            })
            .catch((error) => {
                alert("Error al cerrar sesión: " + error.message);
            });
    }
}

function startHold() {
    clearTimeout(holdTimer);
    holdTimer = setTimeout(() => {
        const currentUser = auth.currentUser;
        if (!currentUser || !currentUser.email) {
            alert("⚠️ Acceso denegado: Debes iniciar sesión con tu cuenta.");
            return;
        }

        const userEmail = currentUser.email.toLowerCase().trim();

        db.ref('administradores').once('value')
        .then((snapshot) => {
            if (!snapshot.exists()) {
                alert("⚠️ No existen administradores registrados.");
                return;
            }

            const data = snapshot.val();
            let esAdmin = false;

            if (typeof data === 'object') {
                const correosAutorizados = Object.values(data).map(email => String(email).toLowerCase().trim());
                esAdmin = correosAutorizados.includes(userEmail);
            }

            if (esAdmin) {
                document.getElementById('admin-panel').style.display = 'block';
                if (typeof cargarPedidosAdmin === 'function') cargarPedidosAdmin('PENDIENTE');
            } else {
                alert("⚠️ Acceso denegado: Tu usuario no está autorizado como administrador.");
            }
        })
        .catch((error) => {
            console.error("Error al consultar la base de datos:", error);
            alert("⚠️ Error de conexión al validar permisos.");
        });
    }, 2500);
}

function endHold() {
    clearTimeout(holdTimer);
}