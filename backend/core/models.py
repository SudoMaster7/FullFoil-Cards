from django.db import models

class CardReference(models.Model):
    name = models.CharField(max_length=255, db_index=True)
    image = models.ImageField(upload_to='card_references/', null=True, blank=True)
    
    # Campo para armazenar features extraídas (ORB descriptors) como array numpy serializado
    # BinaryField é eficiente para armazenar dados binários brutos
    orb_features = models.BinaryField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['name']),
        ]

    def __str__(self):
        return self.name
