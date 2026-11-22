using Microsoft.AspNetCore.Http;

namespace TVJROK.API.Models;

public class UploadKhqrRequest
{
    public IFormFile File { get; set; } = null!;
}