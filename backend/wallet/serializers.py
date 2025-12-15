from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserWallet, Transaction, ReferralCode, Referral
import re


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'date_joined', 'is_staff', 'is_superuser']
        read_only_fields = ['id', 'date_joined', 'is_staff', 'is_superuser']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    password_confirm = serializers.CharField(write_only=True, min_length=6)
    referral_code = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password_confirm', 'first_name', 'last_name', 'referral_code']

    def validate_username(self, value):
        if not re.match(r'^[a-zA-Z0-9_]+$', value):
            raise serializers.ValidationError('Username pode conter apenas letras, números e underscore.')
        if len(value) < 3:
            raise serializers.ValidationError('Username deve ter pelo menos 3 caracteres.')
        return value

    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({'password_confirm': 'As senhas não coincidem.'})
        if User.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError({'email': 'Este email já está em uso.'})
        return data

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        validated_data.pop('referral_code', None)  # Remove, será tratado na view
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
        )
        return user


class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = ['id', 'transaction_type', 'amount', 'description', 'status', 'created_at']
        read_only_fields = ['id', 'created_at']


class WalletSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    recent_transactions = serializers.SerializerMethodField()

    class Meta:
        model = UserWallet
        fields = [
            'id', 'user', 'balance', 'pending_balance', 
            'total_deposited', 'total_withdrawn', 'is_verified',
            'recent_transactions', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'balance', 'pending_balance', 'created_at', 'updated_at']

    def get_recent_transactions(self, obj):
        transactions = obj.transactions.all()[:10]
        return TransactionSerializer(transactions, many=True).data


class DepositSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=10)


class WithdrawSerializer(serializers.Serializer):
    PIX_KEY_TYPES = [
        ('CPF', 'CPF'),
        ('CNPJ', 'CNPJ'),
        ('EMAIL', 'Email'),
        ('PHONE', 'Telefone'),
        ('RANDOM', 'Chave Aleatória'),
    ]
    
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=50)
    pix_key = serializers.CharField(max_length=255)
    pix_key_type = serializers.ChoiceField(choices=PIX_KEY_TYPES)
    
    def validate_pix_key(self, value):
        # Validação básica da chave PIX
        if len(value) < 5:
            raise serializers.ValidationError('Chave PIX inválida.')
        return value.strip()


class ReferralCodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReferralCode
        fields = ['code', 'uses_count', 'total_earned', 'is_active', 'created_at']
        read_only_fields = ['code', 'uses_count', 'total_earned', 'created_at']


class ReferralSerializer(serializers.ModelSerializer):
    referred_username = serializers.CharField(source='referred.username', read_only=True)
    
    class Meta:
        model = Referral
        fields = ['referred_username', 'referrer_bonus', 'referred_bonus', 'bonus_paid', 'created_at']
        read_only_fields = ['referred_username', 'created_at']
