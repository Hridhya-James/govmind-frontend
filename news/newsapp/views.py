from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login
from django.contrib.auth.decorators import login_required 
from django.contrib import messages
from django.contrib.auth import logout
import logging
logger = logging.getLogger(__name__)
def login_view(request):
    logger.debug("Trying to render template: login.html")
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return redirect('dashboard')  # Redirect to a home page after login
        else:
            messages.error(request, 'Invalid username or password.')
    return render(request, 'login.html')

def home(request):
    return render(request, 'home.html') 
def logout_view(request):
    logout(request)
    return redirect('login') 

