
using System.Net.Http.Headers;
using Microsoft.Extensions.Configuration;

namespace TVJROK.Infrastructure.Services;

public class SupabaseStorageService
{
    private readonly HttpClient _httpClient;
    private readonly string _supabaseUrl;
    private readonly string _serviceKey;
    private const string BucketName = "tvjrok-products";

    public SupabaseStorageService(
        HttpClient httpClient,
        IConfiguration configuration)
    {
        _httpClient = httpClient;

        _supabaseUrl = configuration["Supabase:Url"]
            ?? throw new InvalidOperationException("Supabase URL is missing.");

        _serviceKey = configuration["Supabase:ServiceKey"]
            ?? throw new InvalidOperationException("Supabase Service Key is missing.");
    }

    public async Task<string> UploadAsync(
    Stream fileStream,
    string fileName,
    string contentType,
    string folder = "products")
{
    var safeFileName =
        $"{Guid.NewGuid()}{Path.GetExtension(fileName)}";

    var storagePath = $"{folder}/{safeFileName}";

        using var request = new HttpRequestMessage(
            HttpMethod.Post,
            $"{_supabaseUrl}/storage/v1/object/{BucketName}/{storagePath}"
        );

        request.Headers.Add("apikey", _serviceKey);
        request.Headers.Authorization =
            new AuthenticationHeaderValue("Bearer", _serviceKey);

        request.Headers.Add("x-upsert", "false");

        var content = new StreamContent(fileStream);
        content.Headers.ContentType =
            new MediaTypeHeaderValue(contentType);

        request.Content = content;

        using var response = await _httpClient.SendAsync(request);

        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();

            throw new InvalidOperationException(
                $"Supabase upload failed: {error}"
            );
        }

        return $"{_supabaseUrl}/storage/v1/object/public/{BucketName}/{storagePath}";
    }

    public async Task DeleteAsync(string storagePath)
    {
        using var request = new HttpRequestMessage(
            HttpMethod.Delete,
            $"{_supabaseUrl}/storage/v1/object/{BucketName}/{storagePath}"
        );

        request.Headers.Add("apikey", _serviceKey);
        request.Headers.Authorization =
            new AuthenticationHeaderValue("Bearer", _serviceKey);

        using var response = await _httpClient.SendAsync(request);

        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();

            throw new InvalidOperationException(
                $"Supabase delete failed: {error}"
            );
        }
    }
}
